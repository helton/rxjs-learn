import {
  fromEvent,
  from,
  merge,
  interval,
  Observable,
  Subject,
  BehaviorSubject,
  ReplaySubject,
  AsyncSubject
} from "rxjs";
import { share, map, pluck, skipUntil } from "rxjs/operators";

type Kind = "next" | "complete" | "error";

const options = {
  showDateTime: false
};

const formatDate = (d: Date) =>
  ["0" + d.getHours(), "0" + d.getMinutes(), "0" + d.getSeconds()]
    .map(component => component.slice(-2))
    .join(":");

const log = (value: any, observerName?: string, kind?: Kind) => {
  const node = document.createElement("li");
  if (kind) {
    node.classList.add(kind);
  }
  const textNode = document.createTextNode(
    [
      options.showDateTime ? `[${formatDate(new Date())}]` : "",
      observerName ? `${observerName}:` : "",
      value ? value : "<unknown>"
    ]
      .filter(value => !!value)
      .join(" ")
  );
  node.appendChild(textNode);
  document.getElementById("output").appendChild(node);
};

//--------------------------------------------------------------

const lessons = [
  // [Lesson 1]
  // simple observer
  () => {
    const observable = Observable.create((observer: any) => {
      try {
        observer.next("Hey, guys!");
        observer.next("How are you?");
        if (Math.random() > 0.5) {
          observer.complete();
        } else {
          throw "Not good";
        }
        observer.next("This will not be sent");
      } catch (err) {
        observer.error(err);
      }
    });

    const subscription = observable.subscribe(
      (x: any) => log(x, "A", "next"), //onNext callback
      (error: any) => log(error, "A", "error"), //onError callback
      () => log("Completed!", "A", "complete") //onComplete callback
    );
  },

  // [Lesson 2]
  // multiples subscribers
  () => {
    const observable = Observable.create((observer: any) => {
      try {
        observer.next("Hey, guys!");
        observer.next("How are you?");
        observer.next("I'm gonna start to send some events... wait for it!");
        setInterval(() => observer.next("What about now?"), 1000);
      } catch (err) {
        observer.error(err);
      }
    });

    const subscription = observable.subscribe(
      (x: any) => log(x, "A", "next"), //onNext callback
      (error: any) => log(error, "A", "error"), //onError callback
      () => log("Completed!", "A", "complete") //onComplete callback
    );

    const subscription2 = observable.subscribe(
      (x: any) => log(x, "B", "next") //onNext callback
    );

    setTimeout(() => subscription.unsubscribe(), 5000);
  },

  // [Lesson 3]
  // coupling subscribers
  () => {
    const observable = Observable.create((observer: any) => {
      try {
        observer.next("Hey, guys!");
        observer.next("How are you?");
        observer.next("I'm gonna start to send some events... wait for it!");
        setInterval(() => observer.next("What about now?"), 1000);
      } catch (err) {
        observer.error(err);
      }
    });

    const subscription = observable.subscribe(
      (x: any) => log(x, "A", "next"), //onNext callback
      (error: any) => log(error, "A", "error"), //onError callback
      () => log("Completed!", "A", "complete") //onComplete callback
    );

    const subscription2 = observable.subscribe(
      (x: any) => log(x, "B", "next") //onNext callback
    );

    // We're coupling subscription2 to subscription1. Once subscription1 finishes, subscription2 will be gone too
    subscription.add(subscription2);

    setTimeout(() => {
      subscription.unsubscribe();
      log("We're done :D");
    }, 5000);
  },

  // [Lesson 4]
  // sharing observer
  () => {
    const observableBuilder = (observer: any) => {
      try {
        observer.next("Hey, guys!");
        observer.next("How are you?");
        observer.next("I'm gonna start to send some events... wait for it!");
        setInterval(() => observer.next("What about now?"), 1000);
      } catch (err) {
        observer.error(err);
      }
    };

    // with the <share> operator our observable will be hot!
    // (new observers will get only the newest emitted values)
    const observable = Observable.create(observableBuilder).pipe(share());

    const subscription = observable.subscribe(
      (x: any) => log(x, "A", "next"), //onNext callback
      (error: any) => log(error, "A", "error"), //onError callback
      () => log("Completed!", "A", "complete") //onComplete callback
    );

    setTimeout(() => {
      const subscription2 = observable.subscribe((x: any) =>
        log(x, "B", "next")
      );

      setTimeout(() => {
        subscription2.unsubscribe();
        log("I'm done :D", "B");
      }, 6000);
    }, 1000);

    setTimeout(() => {
      subscription.unsubscribe();
      log("I'm done :D", "A");
    }, 6000);
  },

  // [Lesson 5]
  // fromEvent
  () => {
    const observable = fromEvent(document, "mousemove");

    const subscription = observable.subscribe((event: any) => {
      log(`(${event.screenX}, ${event.screenY})`, "MouseMove", "next");
    });

    setTimeout(() => {
      subscription.unsubscribe();
      log("I'm done", "MouseMove");
    }, 2500);
  },

  // [Lesson 6]
  // Subjects: can listen and emit values.
  // Can act as observer and observable
  // New observers will only get new values after the subscription
  () => {
    const subject = new Subject();

    const subscriptionA = subject.subscribe(
      data => log(data, "Observer A", "next"),
      err => log(err, "Observer A", "error"),
      () => log("I'm done", "Observer A", "complete")
    );

    subject.next("The first thing has been sent");

    const subscriptionB = subject.subscribe(data =>
      log(data, "Observer B", "next")
    );
    log("Observer B has subscribed");

    subject.next("A second thing has been sent");
    subject.next("A third thing has been sent");

    subscriptionB.unsubscribe();
    log("Observer B has unsubscribed");

    subject.next("A final thing has been sent");
  },

  // [Lesson 7]
  // BehaviorSubject: starts with an initial value
  // All new subscribers get the latest emitted value upon subscription
  () => {
    const subject = new BehaviorSubject("Initial value");

    const subscriptionA = subject.subscribe(
      data => log(data, "Observer A", "next"),
      err => log(err, "Observer A", "error"),
      () => log("I'm done", "Observer A", "complete")
    );

    subject.next("The first thing has been sent");
    subject.next("A second thing has been sent");

    log("Observer B will subscribe");
    const subscriptionB = subject.subscribe(data =>
      log(data, "Observer B", "next")
    );
    log("Observer B has subscribed");

    subject.next("A third thing has been sent");
    subject.next("A fourth thing has been sent");

    log("Observer B will unsubscribe");
    subscriptionB.unsubscribe();
    log("Observer B has unsubscribed");

    subject.next("A final thing has been sent");
  },

  // [Lesson 8]
  // ReplaySubject: allows you to have a number of events to dispatch
  // to new subscribers upon subscription
  () => {
    const subject = new ReplaySubject(2);

    const subscriptionA = subject.subscribe(
      data => log(data, "Observer A", "next"),
      err => log(err, "Observer A", "error"),
      () => log("I'm done", "Observer A", "complete")
    );

    subject.next("The first thing has been sent");
    subject.next("A second thing has been sent");

    log("Observer B will subscribe");
    const subscriptionB = subject.subscribe(data =>
      log(data, "Observer B", "next")
    );
    log("Observer B has subscribed");

    subject.next("A third thing has been sent");
    subject.next("A fourth thing has been sent");

    log("Observer B will unsubscribe");
    subscriptionB.unsubscribe();
    log("Observer B has unsubscribed");

    subject.next("A final thing has been sent");
  },

  // [Lesson 9]
  // ReplaySubject with timers
  // It'll take the time in consideration to decide if an event should be emitted to a new subscriber or not
  () => {
    const subject = new ReplaySubject(30, 200);

    subject.subscribe(
      data => log(data, "Observer A", "next"),
      err => log(err, "Observer A", "error"),
      () => log("I'm done", "Observer A", "complete")
    );

    let i = 1;
    const int = setInterval(() => subject.next(i++), 100);

    setTimeout(() => {
      log("Observer B will subscribe");
      subject.subscribe(data => log(data, "Observer B", "next"));
      log("Observer B has subscribed");
    }, 500);
  },

  // [Lesson 10]
  // AsyncSubject will emmit only the last value upon completion
  () => {
    const subject = new AsyncSubject();

    subject.subscribe(
      data => log(data, "AsyncSubject", "next"),
      err => log(err, "AsyncSubject", "error"),
      () => log("I'm done", "AsyncSubject", "complete")
    );

    subject.next("First event");
    subject.next("Second event");
    subject.next("Third event");

    subject.complete();
  },

  // [Lesson 11]
  // Operators
  // Creation operators come from 'rxjs'
  // Pipeable operators come from 'rxjs/operators'
  // merge: merge two or more observables (you'll listen to both upon subscription)
  () => {
    const observableA = Observable.create((observer: any) => {
      observer.next("Hey guys!", "A", "next");
      setInterval(() => observer.next("from A"), 200);
      setTimeout(() => {
        log("Observer A is about to finish");
        observer.complete();
        log("Observer A finished");
      }, 2000);
    });

    const observableB = Observable.create((observer: any) => {
      observer.next("How is it going?", "B", "next");
      setInterval(() => observer.next("from B"), 300);
      setTimeout(() => {
        log("Observer B is about to finish");
        observer.complete();
        log("Observer B finished");
      }, 2500);
    });

    const mergedObservable = merge(observableA, observableB);

    log("I'm about to merge observable A and B");
    const subscription = mergedObservable.subscribe(
      (data: any) => log(data, "merge(A, B)", "next"),
      (err: any) => log(err, "merge(A, B)", "error"),
      () => log("Merged observer are done", "merge(A, B)", "complete")
    );

    setTimeout(() => subscription.unsubscribe(), 10000);
  },

  //[Lesson 12]
  // map: map an emitted value to a new value
  () => {
    const observable = Observable.create((observer: any) => {
      observer.next("Hey, guys!");
      observer.next("How's it going?");
    }).pipe(map((x: string) => x.toUpperCase()));

    observable.subscribe((data: any) => log(data, "map(uppercase)", "next"));
  },

  //[Lesson 13]
  // pluck: Get a property from an emitted value
  () => {
    const observable = from([
      { name: "Helton", age: 29 },
      { name: "Peter", age: 32 },
      { name: "Maria", age: 22 },
      { name: "George", age: 49 }
    ]).pipe(pluck("name"));

    observable.subscribe((data: any) => log(data, "pluck('name')", "next"));
  },

  //[Lesson 14]
  // skipUntil
  () => {
    const observableA = Observable.create((observer: any) => {
      let i = 1;
      setInterval(() => {
        log('Observable A will emit a value');
        observer.next(i++);
      }, 1000);
    })

    const observableB = new Subject();

    setTimeout(() => {
      log('Observable B will emit a value');
      observableB.next('Hey!')
    }, 3000);

    const skipUntilObserver = observableA.pipe(skipUntil(observableB));

    skipUntilObserver.subscribe((data: any) => log(data, "observableA.pipe(skipUntil(observableB))", "next"));
  }
];

lessons[lessons.length - 1]();

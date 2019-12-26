import { fromEvent, Observable } from "rxjs";
import { share } from "rxjs/operators";

type Kind = "next" | "complete" | "error";

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
    `[${formatDate(new Date())}] ${observerName ? `<${observerName}> ` : ''}${value}`
  );
  node.appendChild(textNode);
  document.getElementById("output").appendChild(node);
};

//--------------------------------------------------------------

// simple observer
const lesson1 = () => {
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
};

// multiples subscribers
const lesson2 = () => {
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
};

// coupling subscribers
const lesson3 = () => {
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
};

// sharing observer
const lesson4 = () => {
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

};

// fromEvent
const lesson5 = () => {
  const observable = fromEvent(document, 'mousemove');

  const subscription = observable.subscribe((event: any) => {
    log(`(${event.screenX}, ${event.screenY})`, "MouseMove", "next")
  })

  setTimeout(() => {
    subscription.unsubscribe();
    log("I'm done", "MouseMove")
  }, 2500);
}

lesson5();

import React from "react";

const HelloWorld = () => {
  function sayHello() {
    console.log("Hello, World!");
    console.info("Hello, World!");
    console.warn("Hello, World!");
    console.error("Hello, World!");
    console.debug("Hello, World!");
    console.dir({ hello: "world" });
  }

  return <button onClick={sayHello}>Click me!</button>;
};

export default HelloWorld;

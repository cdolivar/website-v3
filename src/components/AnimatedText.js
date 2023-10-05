import React from "react";
import Typed from "typed.js";

const AnimatedText = ({ className }) => {
  // Create reference to store the DOM element containing the animation
  const el = React.useRef(null);
  // Create reference to store the Typed instance itself
  const typed = React.useRef(null);

  React.useEffect(() => {
    const options = {
      strings: [
        "Welcome to my site :)",
        "Talk to me about Photography <span aria-label='camera' role='img'>📷</span>",
        "Talk to me about Switchfoot 🎸",
        "Talk to me about the Atlanta Braves ⚾",
        "Talk to me about CS Lewis 📚",
        "Talk to me about React 👨‍💻",
        "Talk to me about DC Comics 🗯️",
      ],
      typeSpeed: 40,
      backSpeed: 30,
      loop: true,
      loopCount: Infinity,
    };

    // elRef refers to the <span> rendered below
    typed.current = new Typed(el.current, options);

    return () => {
      // Make sure to destroy Typed instance during cleanup
      // to prevent memory leaks
      typed.current.destroy();
    };
  }, []);

  return (
    <div className={className}>
      <span style={{ whiteSpace: "pre" }} ref={el} />
    </div>
  );
};

export default AnimatedText;

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
        "Nice to meet you :)",
        "Talk to me about \nPhotography 📷",
        "Talk to me about \nSwitchfoot 🎸",
        "Talk to me about \nthe Braves ⚾",
        "Talk to me about \nCS Lewis 📚",
        "Talk to me about \nReact 👨‍💻",
        "Talk to me about \nDC Comics 🗯️",
      ],
      typeSpeed: 40,
      backSpeed: 30,
      loop: true,
      loopCount: Infinity,
      contentType: "text",
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

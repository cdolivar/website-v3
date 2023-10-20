import React from "react";
import { createGlobalStyle } from "styled-components";
import styled from "styled-components";
import AnimatedText from "./components/AnimatedText";
import AnimatedCursor from "react-animated-cursor";
import { Tilt } from "react-tilt";

const App = () => {
  const GlobalStyle = createGlobalStyle`
  body {
    background-image: linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%);
    height:100vh;
  }

  html {
    --cursor-color: #d5dedd
  }
  
  html.dark-mode {
    --cursor-color: #fff
  }
  `;

  const Container = styled.div`
    text-align: left;
    font-size: 2em;
    max-width: 500px;
  `;

  const Text = styled.div`
    padding: 5px 0;
    line-height: 1.2em;
    color: #d5dedd !important;
    word-wrap: break-word;
    padding-left: 10px;
  `;

  return (
    <div style={{ display: "flex", alignItems: "center", height: "40vh" }}>
      <GlobalStyle />
      <AnimatedCursor
        innerSize={8}
        outerSize={35}
        innerScale={1}
        outerScale={2}
        outerAlpha={0}
        hasBlendMode={true}
        innerStyle={{
          backgroundColor: "var(--cursor-color)",
        }}
        outerStyle={{
          border: "3px solid var(--cursor-color)",
        }}
      />
      <Tilt
        style={{
          height: 300,
          maxWidth: 400,
          margin: "0 auto",
        }}
        options={{
          reverse: true, // reverse the tilt direction
          max: 5, // max tilt rotation (degrees)
          perspective: 1000, // Transform perspective, the lower the more extreme the tilt gets.
          scale: 1, // 2 = 200%, 1.5 = 150%, etc..
          speed: 1500, // Speed of the enter/exit transition
          transition: true, // Set a transition on enter/exit.
          reset: false, // If the tilt effect has to be reset on exit.
          easing: "cubic-bezier(.03,.98,.52,.99)", // Easing on enter/exit.
        }}
      >
        <Container className="App">
          <headernpm className="App-header">
            <Text
              as="a"
              href="https://www.tagalog.com/dictionary/also_spelled.php?translation_entry_id=2289&e=54a77b"
              target="_blank"
            >
              Kamusta!
            </Text>{" "}
            👋
            <Text>
              My name is Charles <br />
              but I like to go by David
            </Text>
            <Text as={AnimatedText} />
          </headernpm>
        </Container>
      </Tilt>
    </div>
  );
};

export default App;

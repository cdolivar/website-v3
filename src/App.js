import React from "react";
import { createGlobalStyle } from "styled-components";
import styled from "styled-components";
import AnimatedText from "./components/AnimatedText";
import AnimatedCursor from "react-animated-cursor";

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
    padding: 30px;
  `;

  const Text = styled.div`
    padding: 5px 0;
    line-height: 1.2em;
    color: #d5dedd !important;
    word-wrap: break-word;
  `;

  return (
    <>
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
    </>
  );
};

export default App;

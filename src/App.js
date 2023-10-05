import React from "react";
import { createGlobalStyle } from "styled-components";
import styled from "styled-components";
import AnimatedText from "./components/AnimatedText";

const App = () => {
  const GlobalStyle = createGlobalStyle`
  body {
    background: linear-gradient(90deg, hsla(217, 100%, 50%, 1) 0%, hsla(186, 100%, 69%, 1) 100%);
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

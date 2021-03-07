import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { createModel, KaldiRecognizer, Model } from "vosk-browser";
import Microphone from "./microphone";
import { ModelLoader, models } from "./model-loader";

const Wrapper = styled.div`
  width: 80%;
  text-align: left;
  max-width: 700px;
  margin: auto;
  display: flex;
  justify-content: center;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: center;
`;

const ResultContainer = styled.div`
  width: 100%;
  margin: 1rem auto;
  border: 1px solid #aaaaaa;
  padding: 1rem;
  resize: vertical;
  overflow: auto;
`;

const Word = styled.span<{ confidence: number }>`
  color: ${({ confidence }) => {
    const color = Math.max(255 * (1 - confidence) - 20, 0);
    return `rgb(${color},${color},${color})`;
  }};
  white-space: normal;
`;

interface VoskResult {
  result: Array<{
    conf: number;
    start: number;
    end: number;
    word: string;
  }>;
  text: string;
}

const modelMap = new Map<
  string,
  { model: Model; recognizer: KaldiRecognizer }
>();

export const Recognizer: React.FunctionComponent = () => {
  const [utterances, setUtterances] = useState<VoskResult[]>([]);
  const [partial, setPartial] = useState("");
  const [recognizer, setRecognizer] = useState<KaldiRecognizer>();
  const [loading, setLoading] = useState(true);

  const loadModel = async (path: string) => {
    setLoading(true);
    let recognizer: KaldiRecognizer;

    if (modelMap.has(path)) {
      const existing = modelMap.get(path)!;
      recognizer = existing.recognizer;
    } else {
      const model = await createModel(
        process.env.PUBLIC_URL + "/models/" + path
      );

      recognizer = new model.KaldiRecognizer();
      recognizer.on("result", (message: any) => {
        const result: VoskResult = message.result;
        setUtterances((utt: VoskResult[]) => [...utt, result]);
      });

      recognizer.on("partialresult", (message: any) => {
        setPartial(message.result.partial);
      });
      modelMap.set(path, { model, recognizer });
    }

    setRecognizer(() => {
      setLoading(false);
      return recognizer;
    });
  };

  useEffect(() => {
    loadModel(models[4].path);
  }, []);

  return (
    <Wrapper>
      <Header>
        <ModelLoader onModelChange={(path) => loadModel(path)} />
        <Microphone recognizer={recognizer} loading={loading} />
      </Header>
      <ResultContainer>
        {utterances.map((utt, uindex) =>
          utt?.result?.map((word, windex) => (
            <Word
              key={`${uindex}-${windex}`}
              confidence={word.conf}
              title={`Confidence: ${(word.conf * 100).toFixed(2)}%`}
            >
              {word.word}{" "}
            </Word>
          ))
        )}
        <span key="partial">{partial}</span>
      </ResultContainer>
    </Wrapper>
  );
};
// The whole CBM lecture-film. The narration timeline (src/timeline.json, written by tools/timeline.py) sets every scene's
// start and length; neighbouring scenes overlap by XF seconds so the incoming scene dissolves over the outgoing one.
import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from './kit/theme';
import { CaptionBar, HText, Stage, type SceneProps } from './kit/core';
import { useFontsReady } from './kit/fonts';
import { scenePlan, type ScenePlan, type Timeline } from './kit/timeline';
import timeline from './timeline.json';
import captions from './captions.json';
import { SCENES } from './scenes';

export const TL = timeline as unknown as Timeline;
const XF = 0.4;

const Placeholder: React.FC<SceneProps> = ({ t, P }) => (
  <Stage>
    <HText x={960} y={480} ax="center" size={64} weight={600}>{P.title}</HText>
    <HText x={960} y={580} ax="center" size={28} color={C.mute} mono>{`${P.id}  ${t.toFixed(2)} / ${P.dur.toFixed(2)} s`}</HText>
  </Stage>
);

const SceneHost: React.FC<{ P: ScenePlan; xfIn: number; Comp: React.FC<SceneProps> }> = ({ P, xfIn, Comp }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps - xfIn;
  const o = xfIn > 0 ? Math.min(1, (t + xfIn) / xfIn) : 1;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Comp t={t} P={P} />
    </AbsoluteFill>
  );
};

const CUES = captions as { s: number; e: number; text: string }[];
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const c = CUES.find((q) => t >= q.s && t < q.e);
  return c ? <CaptionBar text={c.text} /> : null;
};

export const Film: React.FC<{ captions?: boolean; only?: string; noAudio?: boolean; clean?: boolean }> = ({ captions, only, noAudio, clean }) => {
  (globalThis as unknown as { CBM_CLEAN?: boolean }).CBM_CLEAN = !!clean;
  const ready = useFontsReady();
  const { fps } = useVideoConfig();
  if (!ready) return <AbsoluteFill style={{ background: C.bg }} />;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {TL.scenes.map((sc, i) => {
        if (only && sc.id !== only) return null;
        const Comp = SCENES[sc.id] ?? Placeholder;
        const xfIn = i === 0 ? 0 : XF;
        const from = Math.round((sc.start - xfIn) * fps);
        const to = Math.round(sc.end * fps) + (i === TL.scenes.length - 1 ? 0 : Math.round(XF * fps));
        return (
          <Sequence key={sc.id} from={from} durationInFrames={Math.max(1, to - from)} name={`${sc.id} ${sc.title}`}>
            <SceneHost P={scenePlan(TL, sc.id)} xfIn={xfIn} Comp={Comp} />
          </Sequence>
        );
      })}
      {only || noAudio ? null : <Audio src={staticFile('mix.wav')} />}
      {captions ? <Captions /> : null}
    </AbsoluteFill>
  );
};

import { Fragment } from 'react';
import { splitRich } from './deck.ts';

/** Un texto del guion con sus **negritas** y *cursivas*. */
export default function Rich({ text }: { text: string }) {
  return (
    <>
      {splitRich(text).map((part, i) => {
        if (part.strong) return <strong key={i}>{part.text}</strong>;
        if (part.em) return <em key={i}>{part.text}</em>;
        return <Fragment key={i}>{part.text}</Fragment>;
      })}
    </>
  );
}

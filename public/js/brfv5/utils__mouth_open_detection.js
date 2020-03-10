import { distance, setPointFromVertices } from "./utils__geom.js";

const _p0 = { x: 0, y: 0 };
const _p1 = { x: 0, y: 0 };

// Returns a 'yawnFactor' between 0.0 ... 1.0
// Works only with a 68l model.
export const detectOpenMouth = vertices => {
  const is68lModel = vertices.length === 68 * 2 || vertices.length === 74 * 2;

  if (!is68lModel) return 0.0;

  setPointFromVertices(vertices, 62, _p0); // mouth upper inner lip
  setPointFromVertices(vertices, 66, _p1); // mouth lower inner lip

  const mouthOpen = distance(_p0, _p1);

  return mouthOpen;
};

export default { detectOpenMouth };

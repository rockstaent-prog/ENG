const smoothstep = (low, high, value) => {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
};

// A lightweight portrait rig: head and shoulders have separate pivots, with a
// soft neck transition. It runs locally and needs no video or animation API.
export function avatarPose(time, activity = 0, listening = 0, wordAge = 10, reduced = false) {
  if (reduced) return { turn: 0, nod: 0, sway: 0, breath: 0 };
  const t = time / 1000;
  const emphasis = wordAge >= 0 && wordAge < 0.65 ? Math.sin(wordAge / 0.65 * Math.PI) : 0;
  return {
    turn: Math.sin(t * 0.83) * (0.002 + activity * 0.022) + listening * 0.009,
    nod: Math.sin(t * 1.7) * (0.0008 + activity * 0.0055) + emphasis * activity * 0.007,
    sway: Math.sin(t * 0.64 + 0.6) * (0.001 + activity * 0.006),
    breath: Math.sin(t * 1.35) * (0.0018 + activity * 0.001),
  };
}

export function portraitPoint(x, y, pose, upperBody = false) {
  const head = 1 - smoothstep(upperBody ? 0.3 : 0.56, upperBody ? 0.54 : 0.86, y);
  const shoulders = smoothstep(upperBody ? 0.45 : 0.63, 0.96, y);
  const angle = pose.turn * head;
  const dx = x - 0.51, dy = y - (upperBody ? 0.43 : 0.77);
  const rotateX = dx * Math.cos(angle) - dy * Math.sin(angle) - dx;
  const rotateY = dx * Math.sin(angle) + dy * Math.cos(angle) - dy;
  return {
    x: x + rotateX + pose.sway * (0.3 + shoulders) + (x - 0.5) * pose.breath * shoulders,
    y: y + rotateY + pose.nod * head - pose.breath * shoulders,
  };
}

export function portraitMesh(columns = 6, rows = 16) {
  const points = Array.from({length: (columns + 1) * (rows + 1)}, (_, index) => ({x: (index % (columns + 1)) / columns, y: Math.floor(index / (columns + 1)) / rows}));
  const triangles = [];
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const a = row * (columns + 1) + column, b = a + 1, c = a + columns + 1, d = c + 1;
    triangles.push([a, b, c], [b, d, c]);
  }
  return {points, triangles};
}

export function drawPortrait(ctx, texture, mesh, pose, size, {height = size, scale = 1.045, upperBody = false} = {}) {
  const destination = mesh.points.map(point => {
    const moved = portraitPoint(point.x, point.y, pose, upperBody);
    return {x: (0.5 + (moved.x - 0.5) * scale) * size, y: (0.5 + (moved.y - 0.5) * scale) * height};
  });
  for (const ids of mesh.triangles) {
    const [p0, p1, p2] = ids.map(id => ({x:mesh.points[id].x * size,y:mesh.points[id].y * height}));
    const [q0, q1, q2] = ids.map(id => destination[id]);
    const determinant = (p1.x-p0.x)*(p2.y-p0.y) - (p2.x-p0.x)*(p1.y-p0.y);
    const a = ((q1.x-q0.x)*(p2.y-p0.y) - (q2.x-q0.x)*(p1.y-p0.y)) / determinant;
    const b = ((q1.y-q0.y)*(p2.y-p0.y) - (q2.y-q0.y)*(p1.y-p0.y)) / determinant;
    const c = ((q2.x-q0.x)*(p1.x-p0.x) - (q1.x-q0.x)*(p2.x-p0.x)) / determinant;
    const d = ((q2.y-q0.y)*(p1.x-p0.x) - (q1.y-q0.y)*(p2.x-p0.x)) / determinant;
    // A subpixel overlap prevents hairline seams between adjacent triangles.
    const center = {x:(q0.x+q1.x+q2.x)/3,y:(q0.y+q1.y+q2.y)/3};
    const corners = [q0,q1,q2];
    const inset = Math.min(...corners.map((q,index) => {const next=corners[(index+1)%3];return Math.abs((next.x-q.x)*(center.y-q.y)-(next.y-q.y)*(center.x-q.x))/Math.hypot(next.x-q.x,next.y-q.y);}));
    const overlap = 1 + 0.75 / inset;
    const expanded = corners.map(q => ({x:center.x+(q.x-center.x)*overlap,y:center.y+(q.y-center.y)*overlap}));
    ctx.save(); ctx.beginPath(); ctx.moveTo(expanded[0].x,expanded[0].y); ctx.lineTo(expanded[1].x,expanded[1].y); ctx.lineTo(expanded[2].x,expanded[2].y); ctx.closePath(); ctx.clip();
    ctx.transform(a,b,c,d,q0.x-a*p0.x-c*p0.y,q0.y-b*p0.x-d*p0.y);
    ctx.drawImage(texture,0,0); ctx.restore();
  }
}

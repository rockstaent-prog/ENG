import test from 'node:test';
import assert from 'node:assert/strict';
import { avatarPose, portraitPoint, portraitMesh } from '../src/avatar-motion.js';

test('head and shoulders move around different pivots while staying inside safe margins', () => {
  const mesh = portraitMesh();
  let distinct = false;
  for (let time = 0; time < 12000; time += 200) {
    const pose = avatarPose(time, 1, 0, 0.3);
    const head = portraitPoint(0.5,0.2,pose), shoulders = portraitPoint(0.5,0.96,pose);
    if (Math.abs((head.x-0.5)-(shoulders.x-0.5))>0.001) distinct=true;
    for (const point of mesh.points) {
      const moved=portraitPoint(point.x,point.y,pose);
      assert.ok(moved.x>-0.03 && moved.x<1.03 && moved.y>-0.03 && moved.y<1.03);
    }
  }
  assert.ok(distinct);
});

test('deformation never folds or inverts a portrait triangle during speech', () => {
  const mesh=portraitMesh();
  const area = ([a,b,c]) => (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  for (let time=0;time<15000;time+=250) {
    const pose=avatarPose(time,1,1,0.3);
    const moved=mesh.points.map(p=>portraitPoint(p.x,p.y,pose));
    for (const triangle of mesh.triangles) assert.ok(area(triangle.map(id=>moved[id]))>0.001);
  }
});

test('reduced motion fixes head and body position and speaking has more head movement than idle', () => {
  const point={x:0.25,y:0.25};
  for (const time of [100,1000,5000]) assert.deepEqual(portraitPoint(point.x,point.y,avatarPose(time,1,1,0.1,true)),point);
  const idle=[],speaking=[];
  for (let time=0;time<10000;time+=200) {idle.push(Math.abs(avatarPose(time).turn));speaking.push(Math.abs(avatarPose(time,1).turn));}
  assert.ok(Math.max(...speaking)>Math.max(...idle)*4);
});

import assert from 'node:assert/strict';
import {test} from 'node:test';
import {localWorker} from './helpers/local-worker.mjs';

test('Lesson create/edit and topic video round-trip, including legacy URL forms', async () => {
  const h = localWorker();
  const {cookie} = await h.account({name:'Victor Velarian', role:'admin'});
  const id = 'M7lc1UVf-VE';
  const urls = [
    'https://www.youtube.com/watch?v=' + id,
    'https://youtu.be/' + id + '?si=qa',
    'https://www.youtube.com/shorts/' + id,
    'https://www.youtube.com/live/' + id,
    'https://www.youtube-nocookie.com/embed/' + id,
    'https://m.youtube.com/watch?v=' + id
  ];
  for (const videoUrl of urls) {
    for (const route of ['lesson', 'topic-video']) {
      const r = await h.request('/api/admin/' + route, {
        cookie, method:'POST', data:{topic:0,index:0,title:'QA lesson',body:'QA body',videoUrl}
      });
      assert.equal(r.status, 200, await r.text());
    }
    const lessons = await (await h.request('/api/lessons')).json();
    const topics = await (await h.request('/api/topic-videos')).json();
    assert.equal(lessons.items.find(x => x.topic===0 && x.index===0).videoUrl, videoUrl);
    assert.equal(topics.items.find(x => x.topic===0).videoUrl, videoUrl);
  }
  for (const videoUrl of ['https://youtube.com/playlist?v=' + id, 'https://youtube.com.evil.test/watch?v=' + id, 'http://www.youtube.com/watch?v=' + id, 'https://www.youtube.com/watch?v=invalid']) {
    const r = await h.request('/api/admin/lesson', {cookie,method:'POST',data:{topic:0,index:0,title:'QA lesson',videoUrl}});
    assert.equal(r.status,400);
  }
  const lessons = await (await h.request('/api/lessons')).json();
  assert.equal(lessons.items.find(x => x.topic===0 && x.index===0).videoUrl, urls.at(-1));
});

globalThis.fetch('http://127.0.0.1:8082/favicon.ico')
  .then(async (r) => {
    console.log('status', r.status);
    console.log('ok', r.ok);
    const body = await r.text();
    console.log('body:', body.slice(0, 500));
  })
  .catch((err) => {
    console.error('fetch error', err.message);
  });

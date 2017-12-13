document.getElementById('msg').innerHTML = 'I\'m DAVE.';

cope.req('cope')
  .on('Hi back', obj => {
    console.log(obj);
    document.getElementById('msg').innerHTML = 'I\'m DAVE. Server is ready.';
  })
  .send({
    model: 'test',
    method: 'sayHi',
    data: 'Hello'
  });

document.getElementById('msg').innerHTML = 'I\'m DAVE.';

// Test with fetch API
fetch('/api/test').then(res => {
  console.log(res.json());
});

// Test with jQuery.ajax
$.get({
  url: '/api/test'
}).done(res => {
  console.log('/api/test', res);
});

$.post({
  url: '/api/u/get/profile',
  data: { email: 'taster@xmail.com' }
}).done(res => {
  console.log('/api/u/get/profile', res);
});


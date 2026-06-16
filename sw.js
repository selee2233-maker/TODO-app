// 할일관리 Service Worker — 매일 오전 10시 알림
var CACHE = 'todo-v1';

self.addEventListener('install', function(e) { self.skipWaiting(); });
self.addEventListener('activate', function(e) { e.waitUntil(clients.claim()); });

// 메인 페이지에서 알림 스케줄 요청을 받음
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SCHEDULE_DAILY') {
    scheduleDailyNotification(e.data.todos);
  }
});

var scheduledTimer = null;

function scheduleDailyNotification(todosJson) {
  if (scheduledTimer) clearTimeout(scheduledTimer);

  var now  = new Date();
  var next = new Date();
  next.setHours(10, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);

  var delay = next - now;

  scheduledTimer = setTimeout(function() {
    fireNotification(todosJson);
    // 이후 매 24시간마다 반복
    setInterval(function() { fireNotification(todosJson); }, 24 * 60 * 60 * 1000);
  }, delay);
}

function fireNotification(todosJson) {
  var todos = [];
  try { todos = JSON.parse(todosJson || '[]'); } catch(e) {}

  var today     = new Date().toISOString().slice(0, 10);
  var todayList = todos.filter(function(t) {
    return t.date === today && !t.done && !(t.subItems && t.subItems.every(function(s){ return s.done; }));
  });

  var body;
  if (todayList.length === 0) {
    body = '오늘 예정된 할 일이 없어요 😊';
  } else {
    var titles = todayList.slice(0, 3).map(function(t) {
      return '• ' + (t.text || today);
    });
    if (todayList.length > 3) titles.push('외 ' + (todayList.length - 3) + '개 더...');
    body = titles.join('\n');
  }

  self.registration.showNotification('📋 오늘의 할 일 (' + todayList.length + '개)', {
    body:    body,
    icon:    '/TODO-app/apple-touch-icon-192.png',
    badge:   '/TODO-app/apple-touch-icon-192.png',
    tag:     'daily-todo',
    renotify: true,
    actions: [{ action: 'open', title: '앱 열기' }]
  });
}

// 알림 클릭 시 앱 열기
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(list) {
      if (list.length > 0) return list[0].focus();
      return clients.openWindow('/TODO-app/');
    })
  );
});

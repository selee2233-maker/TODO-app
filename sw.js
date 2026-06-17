// 할일관리 Service Worker — 매일 오전 10시 알림
self.addEventListener('install', function(e) { self.skipWaiting(); });
self.addEventListener('activate', function(e) { e.waitUntil(clients.claim()); });

self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SCHEDULE_DAILY') {
    scheduleDailyNotification(e.data.todos);
  }
});

var scheduledTimer = null;
var savedTodos = '[]';

function scheduleDailyNotification(todosJson) {
  savedTodos = todosJson || '[]';
  if (scheduledTimer) clearTimeout(scheduledTimer);

  var now  = new Date();
  var next = new Date();
  next.setHours(10, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);

  var delay = next - now;
  scheduledTimer = setTimeout(function() {
    fireNotification(savedTodos);
    setInterval(function() { fireNotification(savedTodos); }, 24 * 60 * 60 * 1000);
  }, delay);
}

function fireNotification(todosJson) {
  var todos = [];
  try { todos = JSON.parse(todosJson || '[]'); } catch(e) {}

  var today = new Date().toISOString().slice(0, 10);

  // 오늘 이하 날짜의 미완료 할일 (이월된 것 포함)
  var list = todos.filter(function(t) {
    if (!t.date || t.date > today) return false;
    if (t.subItems && t.subItems.length > 0) return !t.subItems.every(function(s){ return s.done; });
    return !t.done;
  });

  var body = list.length === 0
    ? '오늘 할 일이 없어요 😊'
    : list.slice(0, 4).map(function(t){ return '• ' + (t.text || t.date); }).join('\n')
      + (list.length > 4 ? '\n외 ' + (list.length - 4) + '개 더...' : '');

  self.registration.showNotification('📋 오늘의 할 일 (' + list.length + '개)', {
    body:     body,
    icon:     '/TODO-app/apple-touch-icon-192.png',
    badge:    '/TODO-app/apple-touch-icon-192.png',
    tag:      'daily-todo',
    renotify: true,
    actions:  [{ action: 'open', title: '앱 열기' }]
  });
}

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(list) {
      if (list.length > 0) return list[0].focus();
      return clients.openWindow('/TODO-app/');
    })
  );
});

// Installed Meduza workspace. Every view uses the local media and Telegram services.
const NAV = [['home', 'Workspace'], ['studio', 'Media library'], ['editor', 'snakeitbaby'], ['videos', 'Exports'], ['telegram', 'Telegram inbox']];
const views = {
  home: mediaWorkspaceView,
  studio: () => mediaLibraryView(false),
  editor: snakeEditorView,
  videos: () => mediaLibraryView(true),
  telegram: telegramInboxView,
};
const connections = {
  home: connectWorkspace,
  studio: () => connectMediaLibrary(false),
  editor: connectSnakeEditor,
  videos: () => connectMediaLibrary(true),
  telegram: connectTelegramInbox,
};
let disconnect = () => {};
function go() {
  disconnect();
  const requested = location.hash.slice(2);
  const route = NAV.some(([key]) => key === requested) ? requested : 'home';
  document.querySelector('main').innerHTML = views[route]();
  document.querySelectorAll('#nav a').forEach(link => link.classList.toggle('on', link.dataset.id === route));
  scrollTo(0, 0);
  disconnect = connections[route]() || (() => {});
}
document.querySelector('#nav').innerHTML = NAV.map(([key, name]) => `<a href="#/${key}" data-id="${key}">${name}</a>`).join('');
const motion = document.querySelector('#motion');
function showMotion() {
  const calm = localStorage.getItem('meduzaMotion') === 'off' || location.search.includes('still');
  document.documentElement.classList.toggle('calm', calm);
  motion.textContent = calm ? 'Motion off' : 'Motion on';
}
motion.onclick = () => {
  localStorage.setItem('meduzaMotion', document.documentElement.classList.contains('calm') ? 'on' : 'off');
  showMotion();
};
showMotion();
addEventListener('hashchange', go);
go();

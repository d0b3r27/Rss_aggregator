import uniqueId from 'lodash.uniqueid';

export default (response, state, i18next) => new Promise((resolve, reject) => {
  const parser = new DOMParser();
  const data = parser.parseFromString(response, 'text/xml');
  const errorNode = data.querySelector('parsererror');
  const channel = data.querySelector('channel');
  if (!channel) {
    state.parser.status = 'error';
    reject(new Error(i18next.t('errors.noChannelInRss')));
    return;
  }
  if (errorNode) {
    state.parser.status = 'error';
    reject(new Error(i18next.t('errors.parsingError')));
    return;
  }
  const channelTitle = channel.querySelector('title')?.textContent || '';
  const channelDescription = channel.querySelector('description')?.textContent || '';
  const channelLink = channel.querySelector('link')?.textContent || '';
  const items = Array.from(channel.querySelectorAll('item')).map((item) => ({
    id: uniqueId(),
    title: item.querySelector('title')?.textContent || '',
    description: item.querySelector('description')?.textContent || '',
    pubDate: item.querySelector('pubDate')?.textContent || '',
    link: item.querySelector('link')?.textContent || '',
  }));
  const sortedItems = items.sort((a, b) => new Date(a.pubDate) - new Date(b.pubDate));
  resolve({
    channel: {
      title: channelTitle,
      description: channelDescription,
      link: channelLink,
    },
    posts: sortedItems,
  });
});

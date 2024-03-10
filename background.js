function log(content) {
  console.log(content);
}

async function get(tabId) {
  if (typeof tabId === 'number')
    tabId = tabId.toString()
  const items = await chrome.storage.local.get(tabId)
  return items[tabId]
}

async function set(tabId, data) {
  if (typeof tabId === 'number')
    tabId = tabId.toString()
  await chrome.storage.local.set({ [tabId]: data })
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "OFF",
  });
});

async function toggleState(tab) {
  const tabdata = await get(tab.id)
  // log(tabdata)
  const prevState = tabdata?.state || 'OFF';
  const nextState = prevState === 'ON' ? 'OFF' : 'ON';
  await chrome.action.setBadgeText({
    tabId: tab.id,
    text: nextState,
  });
  await set(tab.id, { ...tabdata, state: nextState });
  return nextState
}

async function handleState(tab, state) {
  if (state === "ON") {
    log(`[${tab.url}] is ON`)
    await chrome.alarms.create(tab.id.toString(), { delayInMinutes: 0.05, periodInMinutes: 0.05 })
    log(`Alarm created ${tab.id}`);
  } else if (state === "OFF") {
    log(`[${tab.url}] is OFF`)
    await chrome.alarms.clear(tab.id.toString())
    log(`Alarm cleared ${tab.id}`);
  }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    tabdata = await get(tabId)
    const state = tabdata?.state || 'OFF';
    await chrome.action.setBadgeText({
      tabId: tabId,
      text: state,
    });
    await handleState(tab, state)
  }
})

const page = 'https://www.pathofexile.com/trade'
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url.startsWith(page)) {
    log(`[${tab.url}] is not on the pathofexile.com/trade page`)
    return;
  }
  const nextState = await toggleState(tab);
  await handleState(tab, nextState)
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  log(`Alarm Activate: ${alarm.name}`);
  const tabId = parseInt(alarm.name);
  await chrome.tabs.reload(tabId)
  log(`Reloaded ${alarm.name}`);
});
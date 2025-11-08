document.addEventListener('DOMContentLoaded', function () {

  chrome.storage.local.get(['values', 'theme'], function (result) {

    const values = result.values || [];
    const theme = result.theme || 'dark';

    document.body.classList.add(theme + '-theme');
    const container = document.getElementById('container');

    if (values.length === 0) {
      
      const plusButton = document.createElement('button');
      plusButton.textContent = '+';
      plusButton.className = 'plus-button';
      plusButton.addEventListener('click', function () {
        chrome.runtime.openOptionsPage();
      });
      container.appendChild(plusButton);

    } else {

      values.forEach(function (value) {

        const item = document.createElement('div');
        item.className = 'item';
        const valueSpan = document.createElement('span');
        valueSpan.textContent = value;

        const copyButton = document.createElement('button');
        copyButton.textContent = 'Copy';
        copyButton.addEventListener('click', function () {
          navigator.clipboard.writeText(value).then(() => {
            copyButton.textContent = 'Copied!';
            setTimeout(() => (copyButton.textContent = 'Copy'), 1000);
          });
        });

        item.appendChild(valueSpan);
        item.appendChild(copyButton);
        container.appendChild(item);
      });

      const editButton = document.createElement('button');
      editButton.textContent = 'Edit';
      editButton.className = 'edit-button';
      editButton.addEventListener('click', function () {
        chrome.runtime.openOptionsPage();
      });

      container.appendChild(editButton);
      const h1 = document.createElement('h2');
      h1.textContent = "Side Clip";
      h1.className = 'app-name';
      container.appendChild(h1);
    }
  });
});
document.addEventListener('DOMContentLoaded', function () {
  const maxValues = 10;
  const valueList = document.getElementById('value-list');
  const newValueInput = document.getElementById('new-value');
  const addButton = document.getElementById('add-button');
  const countSpan = document.getElementById('count');
  const limitMessage = document.getElementById('limit-message');
  chrome.storage.local.get(['values', 'theme'], function (result) {
    const values = result.values || [];
    const theme = result.theme || 'dark';
    document.body.classList.add(theme + '-theme');
    document.querySelector(`input[value="${theme}"]`).checked = true;
    renderValueList(values);
    document.querySelectorAll('input[name="theme"]').forEach((radio) => {
      radio.addEventListener('change', function () {
        const newTheme = this.value;
        chrome.storage.local.set({ theme: newTheme }, function () {
          document.body.className = newTheme + '-theme';
        });
      });
    });
    addButton.addEventListener('click', function () {
      const newValue = newValueInput.value.trim();
      if (newValue && values.length < maxValues) {
        values.push(newValue);
        chrome.storage.local.set({ values: values }, function () {
          renderValueList(values);
          newValueInput.value = '';
        });
      }
    });
    document.getElementById('new-value').addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('add-button').click();
      }
    });
  });
  function renderValueList(values) {
    valueList.innerHTML = '';
    values.forEach((value, index) => {
      const item = document.createElement('div');
      item.className = 'item';
      const valueSpan = document.createElement('span');
      valueSpan.textContent = value;
      valueSpan.className = 'value-span';
      const editButton = document.createElement('button');
      editButton.textContent = 'Edit';
      editButton.className = 'edit-button';
      editButton.addEventListener('click', function () {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.className = 'edit-input';
        item.replaceChild(input, valueSpan);
        input.focus();
        editButton.style.display = 'none';
        deleteButton.style.display = 'none';
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            saveEdit(input, index, values);
          }
        });
        input.addEventListener('blur', function () {
          saveEdit(input, index, values);
        });
      });
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.className = 'delete-button';
      deleteButton.addEventListener('click', function () {
        values.splice(index, 1);
        chrome.storage.local.set({ values: values }, function () {
          renderValueList(values);
        });
      });
      item.appendChild(valueSpan);
      item.appendChild(editButton);
      item.appendChild(deleteButton);
      valueList.appendChild(item);
    });
    countSpan.textContent = values.length;
    newValueInput.style.display = values.length >= maxValues ? 'none' : 'inline-block';
    addButton.disabled = values.length >= maxValues;
    addButton.style.display = values.length >= maxValues ? 'none' : 'inline-block';
    limitMessage.style.display = values.length >= maxValues ? 'block' : 'none';
  }
  function saveEdit(input, index, values) {
    const newValue = input.value.trim();
    if (newValue) { // Exists
      values[index] = newValue;
      chrome.storage.local.set({ values: values }, function () {
        renderValueList(values);
      });
    } else {
      renderValueList(values);
    }
  }
  document.getElementById('extension-shortcuts-button').addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }, () => {
    });
  });
  document.getElementById('clear-storage-button').addEventListener('click', () => {
    const userConfirmed = confirm("This will remove all stored values. Do you wish to proceed")
    if (userConfirmed) {
      const values = [];
      chrome.storage.local.set({ values: values })
      location.reload();
    }
  });
});
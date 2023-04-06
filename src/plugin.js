import Table from './table';
import tableIcon from './img/tableIcon.svg';
import withHeadings from './img/with-headings.svg';
import withoutHeadings from './img/without-headings.svg';
import * as $ from './utils/dom';

/**
 * @typedef {object} TableConfig - configuration that the user can set for the table
 * @property {number} rows - number of rows in the table
 * @property {number} cols - number of columns in the table
 */
/**
 * @typedef {object} Tune - setting for the table
 * @property {string} name - tune name
 * @property {HTMLElement} icon - icon for the tune
 * @property {boolean} isActive - default state of the tune
 * @property {void} setTune - set tune state to the table data
 * @property {boolean} isAllowColors
 * @property {object} colors
 */
/**
 * @typedef {object} TableData - object with the data transferred to form a table
 * @property {boolean} withHeading - setting to use cells of the first row as headings
 * @property {string[][]} content - two-dimensional array which contains table content
 */

/**
 * Table block for Editor.js
 */
export default class TableBlock {
  /**
   * Notify core that read-only mode is supported
   *
   * @returns {boolean}
   */
  static get isReadOnlySupported() {
    return true;
  }

  /**
   * Allow to press Enter inside the CodeTool textarea
   *
   * @returns {boolean}
   * @public
   */
  static get enableLineBreaks() {
    return true;
  }

  /**
   * Render plugin`s main Element and fill it with saved data
   *
   * @param {TableData} data — previously saved data
   * @param {TableConfig} config - user config for Tool
   * @param {object} api - Editor.js API
   * @param {boolean} readOnly - read-only mode flag
   */
  constructor({ data, config, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;
    this.config = config;
    this.data = data;
    this.data = {
      withHeadings: this.getConfig('withHeadings', false),
      content: data && data.content ? data.content : []
    };
    this.table = null;
    this.containerId = null;
    this.selectorId = null;
  }

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   *
   * @returns {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      icon: tableIcon,
      title: 'Table'
    };
  }

  /**
   * Plugins styles
   *
   * @returns {{settingsWrapper: string}}
   */
  static get CSS() {
    return {
      settingsWrapper: 'tc-settings'
    };
  }

  /**
   * Return Tool's view
   *
   * @returns {HTMLDivElement}
   */
  render() {
    document.addEventListener('paste', (event) => {
      window.clipText = event.clipboardData.getData('Text');
    });

    /** creating table */
    this.table = new Table(this.readOnly, this.api, this.data, this.config);

    /** creating container around table */
    this.container = $.make('div', this.api.styles.block);
    this.container.appendChild(this.table.getWrapper());

    this.table.setHeadingsSetting(this.data.withHeadings);

    this.initSelectMaster();

    return this.container;
  }

  initSelectMaster() {
    this.container.children[0].appendChild($.make('div', ['selection']));

    const container = this.container.children[0];
    const selection = this.container.querySelector('.selection');

    let isMouseDown = false;
    let selectedElements = [];
    let startPoint = null;

    container.addEventListener('mousedown', (e) => {
      if (e.button !== 2) return;

      isMouseDown = true;
      startPoint = {
        x: e.clientX + window.scrollX,
        y: e.clientY + window.scrollY
      };

      const containerRect = container.getBoundingClientRect();

      selection.style.display = 'block';
      selection.style.left = `${startPoint.x - containerRect.left - window.scrollX}px`;
      selection.style.top = `${startPoint.y - containerRect.top - window.scrollY}px`;
      selection.style.width = '0';
      selection.style.height = '0';
    });

    container.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;

      const x = e.clientX + window.scrollX;
      const y = e.clientY + window.scrollY;

      const containerRect = container.getBoundingClientRect();

      selection.style.width = `${Math.abs(x - startPoint.x)}px`;
      selection.style.height = `${Math.abs(y - startPoint.y)}px`;
      selection.style.left = `${Math.min(x, startPoint.x) - containerRect.left - window.scrollX}px`;
      selection.style.top = `${Math.min(y, startPoint.y) - containerRect.top - window.scrollY}px`;

      const items = this.container.querySelectorAll('.tc-cell');

      items.forEach((item) => {
        item.addEventListener('click', () => {
          selectedElements.forEach(selectedItem => selectedItem.classList.remove('selected'));
        });

        const rect = item.getBoundingClientRect();
        const selRect = selection.getBoundingClientRect();
        if (
            rect.right >= selRect.left && rect.left <= selRect.right &&
            rect.bottom >= selRect.top && rect.top <= selRect.bottom
        ) {
          item.classList.add('selected');
          if (!selectedElements.includes(item)) {
            selectedElements.push(item);
          }
        } else {
          item.classList.remove('selected');
          selectedElements = selectedElements.filter(el => el !== item);
        }
      });
    });

    container.addEventListener('mouseup', (e) => {
      isMouseDown = false;
      startPoint = null;

      selection.style.display = 'none';
    });

    container.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && e.shiftKey) {
        selectedElements.forEach(item => {
          item.classList.remove('selected');
          item.textContent = '';
        });

        selectedElements = [];
      } else if (e.key === 'Backspace') {
        const itemParents = new Set();

        selectedElements.forEach(item => {
          itemParents.add(item.parentElement);
        });

        const allItemParents = Array.from(this.container.querySelectorAll('.tc-row'));
        const sameOrderSelected = [];

        itemParents.forEach(itemParent => {
          const itemsInParent = Array.from(itemParent.querySelectorAll('.tc-cell'));
          const selectedItemsInParent = itemsInParent.filter(item => selectedElements.includes(item));

          if (selectedItemsInParent.length === itemsInParent.length) {
            itemParent.remove();
          } else {
            selectedItemsInParent.forEach((item, i) => {
              if (sameOrderSelected[i] === undefined) {
                sameOrderSelected[i] = [];
              }
              sameOrderSelected[i].push(item);
            });

            selectedItemsInParent.forEach(item => {
              item.classList.remove('selected');
              item.textContent = '';
            });
          }
        });

        sameOrderSelected.forEach((items, index) => {
          if (items.length === allItemParents.length) {
            items.forEach(item => {
              item.remove();
            });
          }
        });

        selectedElements = [];

        let rows = Array.from(this.container.querySelectorAll('.tc-row'));

        if (rows.length <= 0) {
          this.table.resize();
        }
      }
    });
  }

  /**
   * Add plugin settings
   *
   * @returns {HTMLElement} - wrapper element
   */
  renderSettings() {
    const wrapper = $.make('div', TableBlock.CSS.settingsWrapper);

    const tunes = [ {
      name: this.api.i18n.t('With headings'),
      icon: withHeadings,
      isActive: this.data.withHeadings,
      setTune: () => {
        this.data.withHeadings = true;
      }
    }, {
      name: this.api.i18n.t('Without headings'),
      icon: withoutHeadings,
      isActive: !this.data.withHeadings,
      setTune: () => {
        this.data.withHeadings = false;
      }
    } ];

    tunes.forEach((tune) => {
      let tuneButton = $.make('div', this.api.styles.settingsButton);

      if (tune.isActive) {
        tuneButton.classList.add(this.api.styles.settingsButtonActive);
      }

      tuneButton.innerHTML = tune.icon;
      tuneButton.addEventListener('click', () => this.toggleTune(tune, tuneButton));

      this.api.tooltip.onHover(tuneButton, tune.name, {
        placement: 'top',
        hidingDelay: 500
      });

      wrapper.append(tuneButton);
    });

    return wrapper;
  }

  /**
   * Extract table data from the view
   *
   * @returns {TableData} - saved data
   */
  save() {
    const tableContent = this.table.getData();

    let result = {
      withHeadings: this.data.withHeadings,
      content: tableContent
    };

    return result;
  }

  /**
   * Changes the state of the tune
   * Updates its representation in the table
   *
   * @param {Tune} tune - one of the table settings
   * @param {HTMLElement} tuneButton - DOM element of the tune
   * @returns {void}
   */
  toggleTune(tune, tuneButton) {
    const buttons = tuneButton.parentNode.querySelectorAll('.' + this.api.styles.settingsButton);

    // Clear other buttons
    Array.from(buttons).forEach((button) =>
        button.classList.remove(this.api.styles.settingsButtonActive)
    );

    // Mark active button
    tuneButton.classList.toggle(this.api.styles.settingsButtonActive);
    tune.setTune();

    this.table.setHeadingsSetting(this.data.withHeadings);
  }

  /**
   * Plugin destroyer
   *
   * @returns {void}
   */
  destroy() {
    this.table.destroy();
  }

  /**
   * A helper to get config
   *
   * @returns {any}
   */
  getConfig(configName, defaultValue=null) {
    if(this.data){
      return this.data[configName] ? this.data[configName] : defaultValue;
    }

    return this.config && this.config[configName] ? this.config[configName] : defaultValue;
  }

  /**
   * Table onPaste configuration
   *
   * @public
   */
  static get pasteConfig() {
    return { tags: ['TABLE', 'TR', 'TH', 'TD'] };
  }

  /**
   * On paste callback that is fired from Editor
   *
   * @param {PasteEvent} event - event with pasted data
   */
  onPaste(event) {
    setTimeout(() => {
      if (window.hasOwnProperty('clipText')) {
        let html = '<table>';

        window.clipText.split('\n').forEach(function (line) {
          if(line){
            html += '<tr>';
            html += line.split('\t').map(function(l){
              return '<td>' + l + '</td>';
            }).join('');
            html += '</tr>';
          }
        });
        html += '</table>';

        const table = this.stringToHtml(html).firstChild;

        /** Check if the first row is a header */
        const firstRowHeading = table.querySelector(':scope > thead, tr:first-of-type th');

        /** Get all rows from the table */
        const rows = Array.from(table.querySelectorAll('tr'));

        /** Generate a content matrix */
        const content = rows.map((row) => {
          /** Get cells from row */
          const cells = Array.from(row.querySelectorAll('th, td'))

          /** Return cells content */
          return cells.map((cell) => cell.innerHTML);
        });

        /** Update Tool's data */
        this.data = {
          withHeadings: firstRowHeading !== null,
          content
        };

        /** Update table block */
        if (this.table.wrapper) {
          this.table.wrapper.replaceWith(this.render());
        }
      }
    }, 100);
  }

  stringToHtml(str) {
    let dom = document.createElement('div');
    dom.innerHTML = str;

    return dom;
  };
}

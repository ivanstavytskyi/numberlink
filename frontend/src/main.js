import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';
import * as bootstrap from 'bootstrap';
import { backendApiUrl } from './shared/api.js';
import { closeIcon } from './shared/icons.js';
import { closeMobileNav, initMobileNav } from './shared/nav.js';
import { mapScoreRecord, initShareModal, openShareModal } from './shared/share.js';
import './shared/auth/auth-ui.js';

const cellClick = '/assets/sounds/cell_click.mp3';
const cellConnect = '/assets/sounds/cell_connect.mp3';
const cellDisconnect = '/assets/sounds/cell_disconnect.mp3';

import '@material/mwc-select';
import '@material/mwc-list/mwc-list-item.js';


initMobileNav();
initShareModal();

const FIELD_SIZE_MIN = 7;
const FIELD_SIZE_MAX = 11;
const FIELD_DESKTOP_DEFAULT = { width: 9, height: 9 };
const FIELD_MOBILE_DEFAULT = { width: 7, height: 7 };

function isMobilePlayViewport() {
    return window.matchMedia('(max-width: 576px)').matches;
}

function defaultFieldSize() {
    return isMobilePlayViewport() ? FIELD_MOBILE_DEFAULT : FIELD_DESKTOP_DEFAULT;
}

function clampFieldDim(value, fallback) {
    const n = Number(value);
    if (Number.isInteger(n) && n >= FIELD_SIZE_MIN && n <= FIELD_SIZE_MAX) return n;
    return fallback;
}

function storedFieldSize() {
    const fallback = defaultFieldSize();
    const storedWidth = localStorage.getItem('field_width');
    const storedHeight = localStorage.getItem('field_height');
    return {
        width: storedWidth ? clampFieldDim(storedWidth, fallback.width) : fallback.width,
        height: storedHeight ? clampFieldDim(storedHeight, fallback.height) : fallback.height,
    };
}

function syncFieldSizeSelects(widthElement, heightElement, size) {
    if (String(widthElement.value) !== String(size.width)) {
        widthElement.value = String(size.width);
    }
    if (String(heightElement.value) !== String(size.height)) {
        heightElement.value = String(size.height);
    }
}


async function createBlankTable() {
    const table = document.getElementById('table_container');
    if (table) {
        const slot = table.closest('.board-slot');
        (slot || table).remove();
    }

    const topBlock = document.querySelector('.field_container__parent-block-1');
    if (!topBlock) { console.log('exit'); return; }

    const tableFrame = `<div class="board-slot"><table id="table_container" class="unactive p-0 mx-auto">
                            <tbody>
                            </tbody>
                        </table></div>`;

    topBlock.insertAdjacentHTML('afterend', tableFrame);

    const tableContent = document.querySelector('#table_container tbody');
    if (!tableContent) { console.log('exit'); return; }

    const widthElement = document.getElementById("width");
    const heightElement = document.getElementById("height");
    if (!widthElement) { console.log('exit'); return; }
    if (!heightElement) { console.log('exit'); return; }

    await widthElement.updateComplete;
    await heightElement.updateComplete;

    const size = storedFieldSize();
    syncFieldSizeSelects(widthElement, heightElement, size);
    await widthElement.updateComplete;
    await heightElement.updateComplete;

    const width = size.width;
    const height = size.height;

    let fullContent = '';

    for (let i = 0; i < height; i++) {
        fullContent += `<tr>`;

        for (let j = 0; j < width; j++) {
            let cell = `<td class="cell"><span></span></td>`;
            fullContent += cell;
        }

        fullContent += '</tr>';
    }

    tableContent.innerHTML = fullContent;
    syncGameBoardScale(width, height);
    requestAnimationFrame(() => {
        syncGameBoardScale(width, height);
        requestAnimationFrame(() => syncGameBoardScale(width, height));
    });
}

createBlankTable().then(() => cellNumSelectionListener());

function currentGridSize() {
    const table = document.getElementById('table_container');
    const widthEl = document.getElementById('width');
    const heightEl = document.getElementById('height');
    const cols = table?.querySelectorAll('tr:first-child .cell').length
        || Number(widthEl?.value)
        || 9;
    const rows = table?.querySelectorAll('tr').length
        || Number(heightEl?.value)
        || 9;
    return { cols, rows };
}

function resyncGameBoard() {
    const { cols, rows } = currentGridSize();
    requestAnimationFrame(() => {
        syncGameBoardScale(cols, rows);
        requestAnimationFrame(() => syncGameBoardScale(cols, rows));
    });
}

window.addEventListener('resize', resyncGameBoard);


function syncGameBoardScale(width, height) {
    const field = document.querySelector('.field_container');
    const table = document.getElementById('table_container');
    if (!field || !table) return;

    const cols = Math.max(1, Number(width) || 1);
    const rows = Math.max(1, Number(height) || 1);
    const maxDim = Math.max(cols, rows);

    const header = document.querySelector('header');
    const playBlock = document.getElementById('btn_container');
    const topBlock = document.querySelector('.field_container__parent-block-1');
    const divider = document.querySelector('.field_container__divider');
    const mainEl = document.querySelector('main');
    const fieldStyles = getComputedStyle(field);
    const tableStyles = getComputedStyle(table);

    const outerGap = 22;

    if (mainEl) {
        mainEl.style.paddingTop = `${outerGap}px`;
        mainEl.style.paddingBottom = `${outerGap}px`;
    }

    const tableMarginY =
        (parseFloat(tableStyles.marginTop) || 0) +
        (parseFloat(tableStyles.marginBottom) || 0);

    const playStyles = playBlock ? getComputedStyle(playBlock) : null;
    const playMarginY = playStyles
        ? (parseFloat(playStyles.marginTop) || 0) + (parseFloat(playStyles.marginBottom) || 0)
        : 0;

    const borderY =
        (parseFloat(tableStyles.borderTopWidth) || 0) +
        (parseFloat(tableStyles.borderBottomWidth) || 0);

    const setupChrome = topBlock?.offsetHeight ?? 0;
    const dividerChrome = divider && !topBlock?.contains(divider)
        ? (divider.offsetHeight || 0)
        : 0;

    const chromeHeight =
        (header?.offsetHeight ?? 0) +
        outerGap * 2 +
        setupChrome +
        dividerChrome +
        (playBlock?.offsetHeight ?? 0) +
        playMarginY +
        tableMarginY +
        borderY +
        parseFloat(fieldStyles.paddingTop) +
        parseFloat(fieldStyles.paddingBottom) +
        12;

    const MIN_PLAYABLE_CELL = 32;
    const MAX_CELL = 72;
    const canFitShrink = window.innerHeight >= 640;

    const isNarrow = window.matchMedia('(max-width: 576px)').matches;
    const slot = table.closest('.board-slot');

    const applyCellSize = (cellPx) => {
        table.style.setProperty('--cell-px', `${cellPx}px`);
        table.style.width = `${cellPx * cols}px`;
        table.querySelectorAll('.cell').forEach((cell) => {
            cell.style.width = `${cellPx}px`;
            cell.style.height = `${cellPx}px`;
        });
    };

    if (isNarrow) {
        const slotStyles = slot ? getComputedStyle(slot) : null;
        const slotPadX = slotStyles
            ? (parseFloat(slotStyles.paddingLeft) || 0) + (parseFloat(slotStyles.paddingRight) || 0)
            : 0;
        const slotPadY = slotStyles
            ? (parseFloat(slotStyles.paddingTop) || 0) + (parseFloat(slotStyles.paddingBottom) || 0)
            : 0;
        const slotHeight = slot ? slot.clientHeight - slotPadY : 0;
        const slotWidth = slot ? slot.clientWidth - slotPadX : 0;
        const useSlot = canFitShrink && slotHeight >= 48 && slotWidth >= 48;

        const gap = fieldStyles.rowGap && fieldStyles.rowGap !== 'normal'
            ? (parseFloat(fieldStyles.rowGap) || 0)
            : 0;
        const flexGaps = gap * 2;

        const availableWidth = useSlot
            ? Math.max(48, slotWidth - 8)
            : Math.max(48, field.clientWidth - 32);
        const widthCell = Math.min(MAX_CELL, Math.floor(availableWidth / cols));

        if (!canFitShrink) {
            applyCellSize(Math.max(MIN_PLAYABLE_CELL, widthCell));
            return;
        }

        const availableHeight = useSlot
            ? Math.max(48, slotHeight - borderY)
            : Math.max(48, window.innerHeight - chromeHeight - flexGaps);

        let cellPx = Math.min(
            MAX_CELL,
            Math.floor(availableHeight / rows),
            widthCell
        );
        cellPx = Math.max(MIN_PLAYABLE_CELL, cellPx);
        applyCellSize(cellPx);
        return;
    }

    const availableWidth = Math.max(140, field.clientWidth - 32);
    const widthCell = Math.min(MAX_CELL, Math.floor(availableWidth / cols));

    if (!canFitShrink) {
        applyCellSize(Math.max(MIN_PLAYABLE_CELL, widthCell));
        return;
    }

    const availableHeight = Math.max(140, window.innerHeight - chromeHeight);
    let cellPx = Math.min(
        MAX_CELL,
        Math.floor(availableHeight / maxDim),
        widthCell
    );
    cellPx = Math.max(MIN_PLAYABLE_CELL, cellPx);
    applyCellSize(cellPx);
}

async function cellNumSelectionListener() {

    const widthElement = document.getElementById("width");
    const heightElement = document.getElementById("height");

    if (!widthElement) { console.log('exit'); return; }
    if (!heightElement) { console.log('exit'); return; }

    await widthElement.updateComplete;
    await heightElement.updateComplete;

    const storedWidth = localStorage.getItem("field_width");
    const storedHeight = localStorage.getItem("field_height");

    if (storedWidth && clampFieldDim(storedWidth, 0) === 0) {
        localStorage.setItem("field_width", String(defaultFieldSize().width));
        window.location.reload();
        console.error("Map size is out of range (localstorage)");
        return;
    }

    if (storedHeight && clampFieldDim(storedHeight, 0) === 0) {
        localStorage.setItem("field_height", String(defaultFieldSize().height));
        window.location.reload();
        console.error("Map size is out of range (localstorage)");
        return;
    }

    syncFieldSizeSelects(widthElement, heightElement, storedFieldSize());
    await widthElement.updateComplete;
    await heightElement.updateComplete;
    await createBlankTable();

    widthElement.addEventListener('change', async () => {
        localStorage.setItem("field_width", widthElement.value);
        await createBlankTable();
    });

    heightElement.addEventListener('change', async () => {
        localStorage.setItem("field_height", heightElement.value);
        await createBlankTable();
    });

}

function checkDir(OldX, OldY, NewX, NewY) {

    const Direction = Object.freeze({
        UP: -1,
        DOWN: 1,
        LEFT: -1,
        RIGHT: 1
    });

    if (((OldX + Direction.LEFT > 0 && OldX + Direction.LEFT === NewX) || (OldX + Direction.RIGHT === NewX)) &&
        ((OldY + Direction.UP > 0 && OldY + Direction.UP === NewY) || (OldY + Direction.DOWN === NewY))) {
        return false;
    }

    return true;
}

function enableTouchSupport() {
    const table = document.getElementById('table_container');
    if (!table || table.dataset.touchEnabled === 'true') return;
    table.dataset.touchEnabled = 'true';

    const toMouseEvent = (type, touch) => new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: touch.clientX,
        clientY: touch.clientY
    });

    const targetUnderFinger = (touch) => {
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        return el && table.contains(el) ? el : null;
    };

    table.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const target = targetUnderFinger(touch);
        if (!target) return;
        e.preventDefault(); // block scroll/zoom while drawing
        target.dispatchEvent(toMouseEvent('mousedown', touch));
    }, { passive: false });

    table.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        const target = targetUnderFinger(touch);
        if (!target) return;
        e.preventDefault();
        target.dispatchEvent(toMouseEvent('mousemove', touch));
    }, { passive: false });

    table.addEventListener('touchend', (e) => {
        const touch = e.changedTouches[0];
        const target = targetUnderFinger(touch) || table;
        target.dispatchEvent(toMouseEvent('mouseup', touch));
    });

    table.addEventListener('touchcancel', () => {
        window.dispatchEvent(new MouseEvent('mouseup'));
    });
}

function paintDrawnCell(span, color, value) {
  if (!span.classList.contains('active')) {
    span.id = 'item-' + crypto.randomUUID();
    span.classList.add('active');
  }
  span.style.setProperty('--cell-color', color);
  span.setAttribute('value', value);
  span.innerText = value;
}

function canExtendDraw(fromX, fromY, toX, toY, span, value) {
  if (!checkDir(fromX, fromY, toX, toY)) return false;
  if (!span.classList.contains('active')) return true;
  if (!span.classList.contains('head-tail')) return true;
  return span.getAttribute('value') == value;
}

async function finishRoundIfWon(timerId, gameState) {
  try {
    if (!(await checkWin()) || gameState.gameOver) return;
    gameState.gameOver = true;

    const timerElement = document.getElementById('timer');
    const timeLast = timerElement.innerText;
    const seconds = Number(timerElement.dataset.totalSeconds);
    clearInterval(timerId);
    const savedGame = await saveScore(seconds);
    dispCongratWindow(savedGame);
    const winTimeEl = document.getElementById('winTime');
    if (winTimeEl) winTimeEl.innerText = timeLast;
  } catch (err) {
    console.error('Win check failed:', err);
  }
}

async function connectCells(timerId, gameState) {
    let isDrawing = false;
    let currentMoves = null;
  let color = '';
    let value = null;
    let data_x = null;
    let data_y = null;

    const table = document.getElementById('table_container');
  localStorage.setItem('move', JSON.stringify([]));

    table.addEventListener('mousedown', (e) => {
    const active = e.target.closest('.active');
        if (!active) return;

        isDrawing = true;
    color = active.style.getPropertyValue('--cell-color');
    value = active.getAttribute('value');
        currentMoves = [];
        data_x = active.dataset.x;
        data_y = active.dataset.y;
    playClickSound();
    });

  table.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;

        const cell = e.target.closest('.cell');
        if (!cell) return;

        const span = cell.querySelector('span');
        const NewX = span.dataset.x;
        const NewY = span.dataset.y;

    if (span.classList.contains('head-tail') && span.getAttribute('value') != value) {
            isDrawing = false;
            return;
        }

    if (!canExtendDraw(data_x, data_y, NewX, NewY, span, value)) return;

    paintDrawnCell(span, color, value);
    data_x = NewX;
    data_y = NewY;

    if (currentMoves && !currentMoves.includes(span.id) && !span.classList.contains('head-tail')) {
      currentMoves.push(span.id);
            playConnectSound();
        }
  });

    window.addEventListener('mouseup', () => {
        isDrawing = false;
  });

  table.addEventListener('mouseup', async () => {
        isDrawing = false;

        if (currentMoves && currentMoves.length > 0) {
      const moves = JSON.parse(localStorage.getItem('move')) || [];
            moves.push(currentMoves);
      localStorage.setItem('move', JSON.stringify(moves));
        }

        currentMoves = null;
    color = '';
        value = null;
        data_x = null;
        data_y = null;

    await finishRoundIfWon(timerId, gameState);
    });
}

async function createFilledMap() {

    const gameState = {
        gameOver: false
    };

    document.getElementById("table_container").classList.remove("unactive");

    const widthElement = document.getElementById("width");
    const heightElement = document.getElementById("height");

    if (!widthElement) { console.log('exit'); return; }
    if (!heightElement) { console.log('exit'); return; }

    //
    //

    // wait until "Material web component" initialized
    await widthElement.updateComplete;
    await heightElement.updateComplete;

    const requestURL = `${backendApiUrl()}/create-map` + "?width=" + widthElement.value + "&height=" + heightElement.value;

    let fetchMapData = await (async () => {
        try {
            const response = await fetch(requestURL, {
                credentials: "include"
            });
            if (!response.ok) throw new Error("API error");
            const data = await response.json();

            return data;

        } catch (error) {
            console.error("Error:", error);
            return;
        }
    })();

    const table = document.querySelector('#table_container tbody');
    const colors = [
      '#0d9488',
      '#16a34a',
      '#0284c7',
      '#d97706',
      '#dc2626',
      '#ea580c',
      '#db2777',
      '#65a30d',
      '#7c3aed',
      '#64748b',
      '#0891b2',
    ];

    for (let i = 0; i < heightElement.value; i++) {
        const row = table.rows[i];
        for (let j = 0; j < widthElement.value; j++) {
            const cell = row.cells[j];
            const val = fetchMapData[i][j];

            if (val == -1) {
                cell.innerHTML = `<span data-x="${j}" data-y="${i}"></span>`;
            } else {
                const colorIndex = val % colors.length;
                const currentColor = colors[colorIndex];

                cell.innerHTML = `<span class="active head-tail" style="--cell-color: ${currentColor}" value="${val}" data-x="${j}" data-y="${i}">${val}</span>`;
            }
        }
    }

    const timerId = timer();
    connectCells(timerId, gameState);
    enableTouchSupport();
    helpConnect(timerId, gameState);
}

function undoMove() {
    const undoButton = document.getElementById('undo_button');
    if (!undoButton) { console.log('exit'); return; }

    undoButton.addEventListener('click', () => {
        try {
            const moves = JSON.parse(localStorage.getItem("move")) || [];
            if (!moves || moves.length === 0) return;

            const lastMoves = moves[moves.length - 1];
            for (let i = 0; i < lastMoves.length; i++) {
                const element = document.getElementById(`${lastMoves[i]}`);
                if (!element) continue;

                element.removeAttribute("id");
                element.removeAttribute("value");
                element.removeAttribute("class");
                element.removeAttribute("style");
            }

            moves.pop();
            localStorage.setItem("move", JSON.stringify(moves));
        } finally {
            undoButton.blur();
        }
    })
}

function resetMove() {

    const resetButton = document.getElementById('reset_button');
    if (!resetButton) { console.log('exit'); return; }

    resetButton.addEventListener('click', () => {
        try {
            const table = document.getElementById('table_container');
            if (!table) { console.log('exit'); return; }

            const spans = table.querySelectorAll('.cell span');
            if (!spans) { console.log('exit'); return; }

            spans.forEach((element) => {
                if (!element.classList.contains('head-tail') && element.classList.contains('active')) {
                    element.removeAttribute("id");
                    element.removeAttribute("value");
                    element.removeAttribute("class");
                    element.removeAttribute("style");
                }
            })
        } finally {
            resetButton.blur();
        }
    })

    localStorage.setItem("move", JSON.stringify([]));
}

async function checkWin() {
    const table = document.getElementById('table_container');
    if (!table) return false;

    const spans = table.querySelectorAll('.cell span');

    const allActive = Array.from(spans).every(span =>
        span.classList.contains('active')
    );

    if (!allActive) return false;

    const firstRow = table.querySelector('tr');
    const width = firstRow ? firstRow.querySelectorAll('td').length : 0;
    const height = table.querySelectorAll('tr').length;

    if (!width || !height || spans.length !== width * height) {
        return false;
    }

    const arr = [];
    spans.forEach((el, index) => {
        const rowIndex = Math.floor(index / width);
        if (!arr[rowIndex]) arr[rowIndex] = [];
        arr[rowIndex].push(Number(el.getAttribute('value')));
    });

    try {
        const response = await fetch(`${backendApiUrl()}/map-check`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(arr)
        });
        if (!response.ok) return false;
        const data = await response.json();
        return data === true;
    } catch (error) {
        console.error('map-check failed:', error);
        return false;
    }
}

function gameTimerHtml() {
  return `<div class="field_container__parent-block-1 d-flex justify-content-between flex-wrap mb-3">
                            <div class="field_container__block-1">
                                <div class="field_container__properties_text fs-5">
                                    Time
                                </div>
                                <div class="field_container__conf_props fs-6">
                                    Duration
                                </div>
                            </div>

                            <div class="field_container__block-2-round">

                                <span class="text-center fs-5" id="timer">00:00</span>

                                <div class="vertical-divider"></div>

                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor"
                                    class="bi-clock" viewBox="0 0 16 16">
                                    <path
                                        d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z" />
                                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0" />
                                </svg>
                            </div>

                        </div>`;
}

function gameControlsHtml() {
  return `
                        <div class="game-controls">

                            <div class="btn btn-outline-secondary text-center d-flex justify-content-center align-items-center section-button"
                                id="undo_button">Undo<span class="d-flex align-items-center ps-1"><svg
                                        xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                        class="bi bi-arrow-90deg-left" viewBox="0 0 16 16">
                                        <path fill-rule="evenodd"
                                            d="M1.146 4.854a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 4H12.5A2.5 2.5 0 0 1 15 6.5v8a.5.5 0 0 1-1 0v-8A1.5 1.5 0 0 0 12.5 5H2.707l3.147 3.146a.5.5 0 1 1-.708.708z" />
                                    </svg>
                                </span>
                            </div>

                            <div class="btn btn-outline-danger text-center d-flex justify-content-center align-items-center section-button"
                                id="reset_button">Reset<span class="d-flex align-items-center ps-1"><svg
                                        xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                        class="bi bi-arrow-clockwise" viewBox="0 0 16 16">
                                        <path fill-rule="evenodd"
                                            d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z" />
                                        <path
                                            d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466" />
                                    </svg>
                                </span>
                            </div>

                            <div class="btn btn-outline-info text-center d-flex justify-content-center align-items-center section-button"
                                id="tip_button">Hint<span class="d-flex align-items-center ps-1"><svg
                                        xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                                        class="bi bi-lightbulb" viewBox="0 0 16 16">
                                        <path
                                            d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a2 2 0 0 0-.453-.618A5.98 5.98 0 0 1 2 6m6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1" />
                                    </svg>
                                </span>
                            </div>

                            <div class="btn btn-outline-secondary text-center d-flex justify-content-center align-items-center section-button"
                                id="sound_button">Sound<span class="d-flex align-items-center ps-1"><svg
                                        xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor"
                                        class="bi bi-volume-down" viewBox="0 0 16 16">
                                        <path
                                            d="M9 4a.5.5 0 0 0-.812-.39L5.825 5.5H3.5A.5.5 0 0 0 3 6v4a.5.5 0 0 0 .5.5h2.325l2.363 1.89A.5.5 0 0 0 9 12zM6.312 6.39 8 5.04v5.92L6.312 9.61A.5.5 0 0 0 6 9.5H4v-3h2a.5.5 0 0 0 .312-.11M12.025 8a4.5 4.5 0 0 1-1.318 3.182L10 10.475A3.5 3.5 0 0 0 11.025 8 3.5 3.5 0 0 0 10 5.525l.707-.707A4.5 4.5 0 0 1 12.025 8" />
                                    </svg>
                                </span>
                            </div>
                            
                        </div>`;
}

function replaceFieldTopSection() {
  const fieldHeader = document.querySelector('.field_container__parent-block-1');
  const divider = document.querySelector('.field_container__divider');
  const fieldContainer = document.querySelector('.field_container');
  const button = document.getElementById('play_button');
  const buttonContainer = document.getElementById('btn_container');
  if (!fieldHeader || !divider || !fieldContainer || !button || !buttonContainer) return;

    fieldHeader.remove();
    divider.remove();
    document.querySelector('.field_container__map-controls')?.remove();
    button.remove();
    runAnimation();
  fieldContainer.insertAdjacentHTML('afterbegin', gameTimerHtml());
  buttonContainer.innerHTML = gameControlsHtml();
  resyncGameBoard();
}

function runAnimation() {
    const fieldContainer = document.querySelector('.field_container');

    if (window.matchMedia("(min-width: 577px)").matches) {
        const appearance = fieldContainer.animate([
            {
                opacity: 0,
                transform: 'scale(0.9)',
                filter: 'blur(10px)'
            },
            {
                opacity: 0.4,
                transform: 'scale(0.94)',
                filter: 'blur(0px)',
                offset: 0.4
            },
            {
                opacity: 1,
                transform: 'scale(1)',
                filter: 'blur(0px)'
            }
        ], {
            duration: 700,
            easing: 'ease-out',
            fill: 'forwards'
        });

        appearance.finished.then(() => {
            fieldContainer.animate([
                { width: getComputedStyle(fieldContainer).width },
                { width: '70vw' }
            ], {
                duration: 600,
                easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
                fill: 'forwards'
            });
        });

    }
}

function timer() {
    const timerElement = document.getElementById('timer');
    if (!timerElement) { console.log('exit'); return; }

    let minutes = 0;
    let seconds = 0;

    const timerId = setInterval(() => {
        seconds++;

        if (seconds >= 60) {
            minutes++;
            seconds = 0;
        }

        const seconds_text = String(seconds).padStart(2, '0');
        const minutes_text = String(minutes).padStart(2, '0');
        const time = minutes_text + ":" + seconds_text;

        timerElement.innerText = time;

        timerElement.dataset.totalSeconds = (minutes * 60 + seconds).toString();

        if (minutes >= 60) {
            clearInterval(timerId);
            window.location.reload();
        }
    }, 1000);

    return timerId;
}

function toggleMuteSound() {
    const muteButton = document.getElementById('sound_button');
    if (!muteButton) return;

    if (localStorage.getItem("sound") === "muted") {
        muteButton.innerHTML = `Sound off<span class="d-flex align-items-center ps-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-volume-mute" viewBox="0 0 16 16">
        <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06M6 5.04 4.312 6.39A.5.5 0 0 1 4 6.5H2v3h2a.5.5 0 0 1 .312.11L6 10.96zm7.854.606a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L10.793 8 9.146 6.354a.5.5 0 1 1 .708-.708L11.5 7.293l1.646-1.647a.5.5 0 0 1 .708 0"/>
        </svg></span>`;
    }

    muteButton.addEventListener('click', () => {
        const muted = localStorage.getItem("sound");
        if (!muted) {
            muteButton.innerHTML = `Sound off<span class="d-flex align-items-center ps-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-volume-mute" viewBox="0 0 16 16">
        <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06M6 5.04 4.312 6.39A.5.5 0 0 1 4 6.5H2v3h2a.5.5 0 0 1 .312.11L6 10.96zm7.854.606a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L10.793 8 9.146 6.354a.5.5 0 1 1 .708-.708L11.5 7.293l1.646-1.647a.5.5 0 0 1 .708 0"/>
        </svg></span>`;
            localStorage.setItem("sound", "muted");

        } else if (muted === "muted") {
            muteButton.innerHTML = `Sound<span class="d-flex align-items-center ps-1"><svg
                                        xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor"
                                        class="bi bi-volume-down" viewBox="0 0 16 16">
                                        <path
                                            d="M9 4a.5.5 0 0 0-.812-.39L5.825 5.5H3.5A.5.5 0 0 0 3 6v4a.5.5 0 0 0 .5.5h2.325l2.363 1.89A.5.5 0 0 0 9 12zM6.312 6.39 8 5.04v5.92L6.312 9.61A.5.5 0 0 0 6 9.5H4v-3h2a.5.5 0 0 0 .312-.11M12.025 8a4.5 4.5 0 0 1-1.318 3.182L10 10.475A3.5 3.5 0 0 0 11.025 8 3.5 3.5 0 0 0 10 5.525l.707-.707A4.5 4.5 0 0 1 12.025 8" />
                                    </svg>
                                </span>`;
            localStorage.setItem("sound", "play");
        } else if (muted === "play") {
            muteButton.innerHTML = `Sound off<span class="d-flex align-items-center ps-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-volume-mute" viewBox="0 0 16 16">
        <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06M6 5.04 4.312 6.39A.5.5 0 0 1 4 6.5H2v3h2a.5.5 0 0 1 .312.11L6 10.96zm7.854.606a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1 .708 0"/>
        </svg></span>`;
            localStorage.setItem("sound", "muted");
        }
        muteButton.blur();
    });
}

function readBoardGrid(table) {
            const spans = table.querySelectorAll('.cell span');
            const firstRow = table.querySelector('tr');
            const width = firstRow ? firstRow.querySelectorAll('td').length : 0;
            const height = table.querySelectorAll('tr').length;
  if (!width || !height || spans.length !== width * height) return null;

  const grid = [];
            for (let i = 0; i < height; i++) {
    const row = [];
                for (let j = 0; j < width; j++) {
      const span = spans[i * width + j];
      row.push(span.classList.contains('active') ? Number(span.getAttribute('value')) : -1);
    }
    grid.push(row);
  }
  return { spans, width, height, grid };
}

function colorForValue(value) {
  const heads = document.querySelectorAll('#table_container .cell span.active.head-tail');
  const match = Array.from(heads).find((el) => Number(el.getAttribute('value')) === value);
  return match ? match.style.getPropertyValue('--cell-color') : '';
}

function applyHintMap(spans, width, height, mapResponse) {
            for (let i = 0; i < height; i++) {
                for (let j = 0; j < width; j++) {
      const span = spans[i * width + j];
      const next = mapResponse[i][j];

      if (next !== -1) {
        if (span.classList.contains('active')) continue;
        span.id = 'item-' + crypto.randomUUID();
        span.classList.add('active');
        span.setAttribute('value', Number(next));
        span.innerText = next;
        const color = colorForValue(next);
        if (color) span.style.setProperty('--cell-color', color);
        continue;
      }

      if (span.classList.contains('active')) {
        span.removeAttribute('id');
        span.classList.remove('active');
        span.removeAttribute('value');
        span.innerText = null;
      }
    }
  }
}

async function helpConnect(timerId, gameState) {
  const helpButton = document.getElementById('tip_button');
  if (!helpButton) return;

  helpButton.addEventListener('click', async () => {
    try {
      const table = document.getElementById('table_container');
      if (!table) return;

      const board = readBoardGrid(table);
      if (!board) return;

      const hintResponse = await fetch(`${backendApiUrl()}/hint-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(board.grid),
        credentials: 'include',
      });
      if (!hintResponse.ok) throw new Error('Unable to get hint!');

      const mapResponse = (await hintResponse.json()).map;
      if (!mapResponse) return;

      applyHintMap(board.spans, board.width, board.height, mapResponse);
      await finishRoundIfWon(timerId, gameState);
    } catch (error) {
      console.error(error);
    } finally {
      helpButton.blur();
    }
  });
}

function playClickSound() {
    if (!localStorage.getItem("sound") || localStorage.getItem("sound") === "play") {
        const audio = new Audio(cellClick);
        audio.play();
    }
}


function playConnectSound() {
    if (!localStorage.getItem("sound") || localStorage.getItem("sound") === "play") {
        const audio = new Audio(cellConnect);
        audio.play();
    }
}

function playDisconnectSound() {
    if (!localStorage.getItem("sound") || localStorage.getItem("sound") === "play") {
        const audio = new Audio(cellDisconnect);
        audio.play();
    }
}

function changeUrl() {
    history.pushState(
        { page: "game" },
        "",
        "/game"
    );

    window.addEventListener("popstate", (e) => {
        if (window.location.pathname === "/") {
            window.location.reload();
        }
    });
}

function dispCongratWindow(savedGame = null) {
    const mainElement = document.getElementById('main');
    const trophyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v6a5 5 0 0 1-10 0z"/><path d="M17 5h3a1 1 0 0 1 1 1c0 2.5-2 4.5-4 4.5"/><path d="M7 5H4a1 1 0 0 0-1 1c0 2.5 2 4.5 4 4.5"/><path d="M4 1v1.6"/><path d="M3.2 1.8h1.6"/><path d="M20 .8v2.4"/><path d="M18.8 2h2.4"/></svg>`;
    const modalResultWindow = `<div class="win-overlay" id="winOverlay">
      <div class="win-modal" role="alertdialog" aria-modal="true" aria-labelledby="win-title" aria-describedby="win-lead">
        <button type="button" class="win-modal__close" data-win-menu aria-label="Back to menu">${closeIcon()}</button>
    <div class="win-header">
          <div class="trophy" aria-hidden="true">${trophyIcon}</div>
          <h2 id="win-title">Congratulations</h2>
        <p id="win-lead">Puzzle solved</p>
    </div>
    <div class="win-stats">
        <div class="stat">
            <span>Time</span>
            <b id="winTime">00:30</b>
        </div>
    </div>
    <div class="win-buttons">
          <button type="button" class="win-btn primary" id="win_play_again">Play again</button>
          <button type="button" class="win-btn leaderboard" id="win_leaderboard"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13V8"/><path d="M8 13V3"/><path d="M13 13V6"/></svg>View leaderboard</button>
          <button type="button" class="win-btn share" id="win_share" hidden><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line></svg>Share result</button>
          <button type="button" class="win-btn secondary" id="win_back_menu" data-win-menu><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 16 16" aria-hidden="true"><path d="M13 8H3"/><path d="M7 4 3 8l4 4"/></svg>Back to menu</button>
    </div>
</div>
        </div>`
    if (!document.getElementById('winOverlay')) {
        document.querySelector('body').style.overflow = 'hidden';
        mainElement.insertAdjacentHTML('afterend', modalResultWindow);
    }
    playNewGame();
    openLeaderboard();
    wireWinShare(savedGame);
    backToMenu();
}

function wireWinShare(savedGame) {
    const shareButton = document.getElementById('win_share');
    if (!shareButton) return;
    if (!savedGame?.mapTrackId) {
        shareButton.hidden = true;
        return;
    }
    shareButton.hidden = false;
    shareButton.addEventListener('click', () => openShareModal(savedGame));
}

function playNewGame() {
    const newGameButton = document.getElementById('win_play_again');
    if (!newGameButton) return;
    newGameButton.addEventListener('click', () => {
        localStorage.setItem('autostart', "on");
        window.location.href = "/";
    })
}

function openLeaderboard() {
    const leaderboardButton = document.getElementById('win_leaderboard');
    if (!leaderboardButton) return;
    leaderboardButton.addEventListener('click', () => {
        localStorage.setItem('autostart', "off");
        window.location.href = "/leaderboard/";
    })
}

function backToMenu() {
    const overlay = document.getElementById('winOverlay');
    overlay?.addEventListener('click', (e) => {
        if (e.target !== overlay) return;
        localStorage.setItem('autostart', 'off');
        window.location.href = '/';
    });
    document.querySelectorAll('[data-win-menu]').forEach((el) => {
        el.addEventListener('click', () => {
            localStorage.setItem('autostart', 'off');
            window.location.href = '/';
        });
    });
}

async function saveScore(time) {
    const query = `${backendApiUrl()}/score`;
    const body = {
        elapsedSeconds: time
    }

    try {
        const response = await fetch(query,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(body)
            });

        if (response.status === 401 || response.status === 403) {
            window.NumberLinkAuth?.open('signup');
            throw new Error('Log in to save your score.');
        }
        if (!response.ok) throw new Error("API error");
        const data = await response.json();
        return mapScoreRecord(data);
    } catch (error) {
        console.error("Error:", error);
        return null;
    }
}

function prepareRound() {
    changeUrl();
    createFilledMap();
    replaceFieldTopSection();
    undoMove();
    resetMove();
    toggleMuteSound();
}

(async function launchRound() {
    if (localStorage.getItem('autostart') === "on") {
        localStorage.setItem('autostart', "off");
        setTimeout(() => {
            prepareRound();
        }, 10);
    }

    const playButton = document.getElementById('play_button');
    if (!playButton) return;

    const startGame = () => {
        if (!document.getElementById('play_button')) return;
        closeMobileNav();
        prepareRound();
    };

    playButton.addEventListener('click', startGame);

    // Enter/Space work even when PLAY is not focused (mwc-select often steals focus)
    window.addEventListener('keydown', (e) => {
        if (!document.getElementById('play_button')) return;
        if (e.key !== 'Enter' && e.key !== ' ') return;
        if (e.repeat) return;

        const tag = document.activeElement?.tagName;
        if (tag === 'TEXTAREA' || tag === 'INPUT') return;

        e.preventDefault();
        startGame();
    });
})();

function searchPathToken() {
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    const match = path.match(/^\/search(?:\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}))?$/i);
    if (!match) return null;
    return match[1] || '';
}

function isSearchPath() {
    return searchPathToken() !== null;
}

function formatSharedSeconds(total) {
    if (total < 60) return `${total}s`;
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function formatSharedHints(hints) {
    if (hints === 0) return 'no hints';
    if (hints === 1) return '1 hint';
    return `${hints} hints`;
}

function openSharedResultModal({ title, score, meta, hint, empty, hideActions }) {
    if (document.getElementById('shared_overlay')) return;

    document.body.insertAdjacentHTML('beforeend', `
        <div class="shared_overlay" id="shared_overlay" hidden>
            <div class="shared_card${empty ? ' shared_card--empty' : ''}${hideActions ? ' shared_card--authed' : ''}" role="dialog" aria-modal="true" aria-labelledby="shared_kicker">
                <button type="button" class="shared_close" id="shared_close" aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" aria-hidden="true">
                        <path d="M18 6 6 18"></path>
                        <path d="m6 6 12 12"></path>
                    </svg>
                </button>

                <div class="shared_kicker" id="shared_kicker">Shared result</div>

                <div class="shared_result">
                    <div class="shared_trophy" aria-hidden="true">
                        <span class="confetti c1"></span>
                        <span class="confetti c2"></span>
                        <span class="confetti c3"></span>
                        <span class="confetti c4"></span>
                        <span class="confetti c5"></span>
                        <span class="confetti c6"></span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round">
                            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                            <path d="M4 22h16"></path>
                            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                        </svg>
                    </div>
                    <div class="shared_player" id="shared_player"></div>
                    <div class="shared_score">
                        <span id="shared_score_value"></span>
                        <span class="shared_score_unit">pts</span>
                    </div>
                    <div class="shared_meta" id="shared_meta"></div>
                </div>

                <div class="shared_cta_hint" id="shared_cta_hint"></div>

                <div class="shared_actions">
                    <button type="button" class="shared_btn shared_btn--solid" id="shared_signup">Sign up to play</button>
                    <button type="button" class="shared_btn shared_btn--ghost" id="shared_login">Log in</button>
                </div>
            </div>
        </div>
    `);

    document.getElementById('shared_player').textContent = title;
    document.getElementById('shared_score_value').textContent = score == null ? '' : String(score);
    document.getElementById('shared_meta').textContent = meta || '';
    document.getElementById('shared_cta_hint').textContent = hint;

    const overlay = document.getElementById('shared_overlay');

    function closeSharedModal() {
        if (overlay.hidden) return;
        overlay.classList.remove('show');
        setTimeout(() => {
            overlay.hidden = true;
        }, 180);
        const url = new URL(window.location.href);
        ['shared', 'access', 'player', 'size', 'seconds', 'hints', 'map_track_id'].forEach((k) => url.searchParams.delete(k));
        const nextPath = isSearchPath() ? '/' : url.pathname;
        window.history.replaceState({}, '', nextPath + url.search + url.hash);
    }

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeSharedModal();
    });
    document.getElementById('shared_close').addEventListener('click', closeSharedModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !overlay.hidden) closeSharedModal();
    });

    document.getElementById('shared_signup').addEventListener('click', () => {
        closeSharedModal();
        openAuth('signup');
    });
    document.getElementById('shared_login').addEventListener('click', () => {
        closeSharedModal();
        openAuth('login');
    });

    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('show'));
}

function syncSharedAuthActions() {
    const card = document.querySelector('#shared_overlay .shared_card');
    if (!card || card.classList.contains('shared_card--empty')) return;
    card.classList.toggle('shared_card--authed', document.body.classList.contains('is-authenticated'));
}

function openSharedNotFoundModal(message, hint) {
    openSharedResultModal({
        empty: true,
        title: message || 'Results not found',
        score: null,
        meta: '',
        hint: hint || 'This shared result is not available.\nCheck the link is correct and has not expired.',
    });
}

function openSharedFoundModal(result) {
    const width = Number.parseInt(result.fieldWidth ?? '', 10);
    const height = Number.parseInt(result.fieldHeight ?? result.fieldWidth ?? '', 10);
    const seconds = Number.parseInt(result.elapsedSeconds ?? '', 10);
    const rawHints = Number.parseInt(result.hints ?? '0', 10);
    const points = Number.parseInt(result.points ?? '', 10);
    const player = String(result.player || 'A NumberLink player').slice(0, 32);

    if (!Number.isInteger(width) || width < 5 || width > 15) {
        openSharedNotFoundModal('Results not found');
        return;
    }
    if (!Number.isInteger(height) || height < 5 || height > 15) {
        openSharedNotFoundModal('Results not found');
        return;
    }
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 86400) {
        openSharedNotFoundModal('Results not found');
        return;
    }
    if (!Number.isInteger(points) || points < 0) {
        openSharedNotFoundModal('Results not found');
        return;
    }
    const hints = Number.isInteger(rawHints) && rawHints >= 0 && rawHints <= 99 ? rawHints : 0;

    openSharedResultModal({
        empty: false,
        hideActions: document.body.classList.contains('is-authenticated'),
        title: `${player} solved a ${width}×${height} puzzle`,
        score: points,
        meta: `${formatSharedSeconds(seconds)} · ${formatSharedHints(hints)}`,
        hint: 'Think you can beat it? Join in and play.',
    });
    syncSharedAuthActions();
}

async function loadSharedSearchResult(token) {
    if (!token) {
        openSharedNotFoundModal('Results not found');
        return;
    }
    const path = `/search/${encodeURIComponent(token)}`;
    try {
        const response = await fetch(`${backendApiUrl()}${path}`, { credentials: 'include' });
        let body = null;
        try {
            body = await response.json();
        } catch {
            body = null;
        }
        if (response.status === 403) {
            openSharedNotFoundModal(
                typeof body?.message === 'string' ? body.message : 'This result is private',
                'Log in with the account that owns this link.\nCheck that the link was entered correctly.',
            );
            return;
        }
        if (!response.ok) {
            openSharedNotFoundModal(typeof body?.message === 'string' ? body.message : 'Results not found');
            return;
        }
        openSharedFoundModal(body || {});
        return;
    } catch {
        openSharedNotFoundModal('Results not found');
    }
}

(function initSharedResultModal() {
    document.addEventListener('numberlink:auth', syncSharedAuthActions);

    const token = searchPathToken();
    if (token !== null) {
        loadSharedSearchResult(token);
        return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('shared') !== '1') return;
    if (params.get('access') === 'private') return;

    const size = Number.parseInt(params.get('size') ?? '', 10);
    const seconds = Number.parseInt(params.get('seconds') ?? '', 10);
    const rawHints = Number.parseInt(params.get('hints') ?? '0', 10);
    const player = (params.get('player') || 'A NumberLink player').slice(0, 32);

    if (!Number.isInteger(size) || size < 5 || size > 15) return;
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 86400) return;
    const hints = Number.isInteger(rawHints) && rawHints >= 0 && rawHints <= 99 ? rawHints : 0;

    const score = Math.round(10000 / seconds);
    const time = seconds < 60
        ? `${seconds}s`
        : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    const hintsText = hints === 0 ? 'no hints' : hints === 1 ? '1 hint' : `${hints} hints`;

    openSharedResultModal({
        empty: false,
        title: `${player} solved a ${size}×${size} puzzle`,
        score,
        meta: `${time} · ${hintsText}`,
        hint: 'Think you can beat it? Join in and play.',
    });
})();

/**
 * AurumCalc v2.0 — Motor de Cálculo de Aleaciones de Oro
 * Incluye: Desde Oro Disponible, Peso Final Deseado, Conversión de Kilates
 * Fórmulas estándar de la industria joyera internacional
 */

// ============================================
// ALLOY DATABASE
// ============================================
const ALLOY_DB = {
    22: {
        amarillo: { Au: 91.67, Ag: 5.00, Cu: 2.00, Zn: 1.33 },
    },
    21: {
        amarillo: { Au: 87.50, Ag: 6.00, Cu: 5.50, Zn: 1.00 },
    },
    18: {
        amarillo: { Au: 75.00, Ag: 12.50, Cu: 12.50 },
        rosa: { Au: 75.00, Ag: 2.75, Cu: 22.25 },
        blanco: { Au: 75.00, Pd: 25.00 },
        verde: { Au: 75.00, Ag: 25.00 },
    },
    14: {
        amarillo: { Au: 58.33, Ag: 25.00, Cu: 16.67 },
        rosa: { Au: 58.33, Ag: 9.17, Cu: 32.50 },
        blanco: { Au: 58.33, Pd: 21.67, Ag: 20.00 },
    },
    10: {
        amarillo: { Au: 41.67, Ag: 29.17, Cu: 29.17 },
        rosa: { Au: 41.67, Ag: 8.33, Cu: 50.00 },
        blanco: { Au: 41.67, Ag: 0.00, Cu: 24.00, Zn: 17.33, Pd: 17.00 },
    },
    9: {
        amarillo: { Au: 37.50, Ag: 31.25, Cu: 31.25 },
    },
};

const METAL_INFO = {
    Au: { name: 'Oro (Au)', fullName: 'Oro', color: '#FFD700', symbol: 'Au' },
    Ag: { name: 'Plata (Ag)', fullName: 'Plata', color: '#C0C0C0', symbol: 'Ag' },
    Cu: { name: 'Cobre (Cu)', fullName: 'Cobre', color: '#B87333', symbol: 'Cu' },
    Zn: { name: 'Zinc (Zn)', fullName: 'Zinc', color: '#7A8B99', symbol: 'Zn' },
    Pd: { name: 'Paladio (Pd)', fullName: 'Paladio', color: '#CED4DA', symbol: 'Pd' },
};

const COLOR_NAMES = {
    amarillo: 'Amarillo',
    rosa: 'Rosa',
    blanco: 'Blanco',
    verde: 'Verde',
};

// ============================================
// STATE
// ============================================
let state = {
    mode: 'available',  // 'available' | 'target' | 'convert'
    karat: 18,          // target karat (internal value or 'custom')
    karatManual: 18,    // specific target karat value
    karatFrom: 16,      // source karat
    karatFromManual: 16,// specific source karat value
    color: 'amarillo',
};

// ============================================
// DOM REFERENCES
// ============================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const els = {
    weightInput: $('#weight-input'),
    weightLabel: $('#weight-label-text'),
    karatGrid: $('#karat-grid'),
    colorGrid: $('#color-grid'),
    btnCalculate: $('#btn-calculate'),
    btnPrint: $('#btn-print'),
    btnReference: $('#btn-reference-table'),
    resultsEmpty: $('#results-empty'),
    resultsContent: $('#results-content'),
    summaryAlloy: $('#summary-alloy'),
    summaryTotal: $('#summary-total'),
    summaryPurity: $('#summary-purity'),
    metalsBreakdown: $('#metals-breakdown'),
    proportionBar: $('#proportion-bar'),
    proportionLegend: $('#proportion-legend'),
    modalOverlay: $('#modal-overlay'),
    modalClose: $('#modal-close'),
    referenceTbody: $('#reference-tbody'),
    modeAvailable: $('#mode-available'),
    modeTarget: $('#mode-target'),
    modeConvert: $('#mode-convert'),
    sourceKaratGroup: $('#source-karat-group'),
    sourceKaratGrid: $('#source-karat-grid'),
    directionBadge: $('#convert-direction-badge'),
    convertInfoBanner: $('#convert-info-banner'),
    convertInfoText: $('#convert-info-text'),
    addSection: $('#add-section'),
    addItems: $('#add-items'),
    targetKaratLabel: $('#target-karat-label'),
    sourceKaratManual: $('#source-karat-manual'),
    targetKaratManual: $('#target-karat-manual'),
    sourceCustomInputWrapper: $('#source-custom-input-wrapper'),
    targetCustomInputWrapper: $('#target-custom-input-wrapper'),
};

// ============================================
// CALCULATION ENGINE
// ============================================

/**
 * Standard alloy calculation (modes: available / target)
 */
function calculateAlloy(weight, karat, color, mode) {
    let alloy = ALLOY_DB[karat]?.[color];

    // Fallback logic for manual/custom karats
    if (!alloy) {
        const closestKarat = findClosestKarat(karat, color);
        alloy = JSON.parse(JSON.stringify(ALLOY_DB[closestKarat][color]));
        alloy.Au = (karat / 24) * 100;

        // Adjust other metals proportionally to maintain color
        let otherMetalsSum = 0;
        for (const [m, p] of Object.entries(alloy)) { if (m !== 'Au') otherMetalsSum += p; }
        const targetOtherSum = 100 - alloy.Au;
        for (const m in alloy) { if (m !== 'Au') alloy[m] = (alloy[m] / otherMetalsSum) * targetOtherSum; }
    }

    const auPercent = alloy.Au / 100;
    let totalWeight, results;

    if (mode === 'available') {
        totalWeight = weight / auPercent;
        results = {};
        for (const [metal, percent] of Object.entries(alloy)) {
            results[metal] = {
                grams: totalWeight * (percent / 100),
                percent: percent,
            };
        }
    } else {
        totalWeight = weight;
        results = {};
        for (const [metal, percent] of Object.entries(alloy)) {
            results[metal] = {
                grams: totalWeight * (percent / 100),
                percent: percent,
            };
        }
    }

    return { totalWeight, results, karat, color, mode };
}

/**
 * Karat Conversion Calculator
 *
 * SUBIR kilate (karatFrom < karatTo):
 *   Se agrega oro 24K puro
 *   Y = W × (K2 - K1) / (24 - K2)
 *
 * BAJAR kilate (karatFrom > karatTo):
 *   Se agrega liga según el color objetivo
 *   Peso final = oro_existente / (K2/24)
 *   Liga total = peso_final - W
 *   Distribución según porcentajes del color (excluyendo Au)
 */
function calculateConversion(weight, karatFrom, karatTo, color) {
    if (karatFrom === karatTo) return null;

    let alloyTarget = ALLOY_DB[karatTo]?.[color];

    // Fallback logic for custom target karat
    if (!alloyTarget) {
        const closestKarat = findClosestKarat(karatTo, color);
        alloyTarget = JSON.parse(JSON.stringify(ALLOY_DB[closestKarat][color]));
        alloyTarget.Au = (karatTo / 24) * 100;

        let otherMetalsSum = 0;
        for (const [m, p] of Object.entries(alloyTarget)) { if (m !== 'Au') otherMetalsSum += p; }
        const targetOtherSum = 100 - alloyTarget.Au;
        for (const m in alloyTarget) {
            if (m !== 'Au') alloyTarget[m] = (alloyTarget[m] / otherMetalsSum) * targetOtherSum;
        }
    }

    const purityFrom = karatFrom / 24;
    const purityTo = karatTo / 24;
    const goldInMaterial = weight * purityFrom;

    let totalWeight, addMetals = {}, results = {};

    if (karatTo > karatFrom) {
        // === SUBIR KILATE: agregar oro 24K ===
        const goldToAdd = weight * (karatTo - karatFrom) / (24 - karatTo);
        totalWeight = weight + goldToAdd;

        addMetals = {
            Au: { grams: goldToAdd, label: 'Oro 24K puro' }
        };

        // Final composition matches target alloy percentages
        for (const [metal, percent] of Object.entries(alloyTarget)) {
            results[metal] = {
                grams: totalWeight * (percent / 100),
                percent: percent,
            };
        }
    } else {
        // === BAJAR KILATE: agregar liga ===
        totalWeight = goldInMaterial / purityTo;
        const ligaTotal = totalWeight - weight;

        // Get liga percentages (all metals except Au in target alloy)
        const ligaComposition = {};
        let ligaTotalPercent = 0;
        for (const [metal, percent] of Object.entries(alloyTarget)) {
            if (metal !== 'Au') {
                ligaComposition[metal] = percent;
                ligaTotalPercent += percent;
            }
        }

        // Distribute liga proportionally
        for (const [metal, percent] of Object.entries(ligaComposition)) {
            const proportion = percent / ligaTotalPercent;
            const grams = ligaTotal * proportion;
            if (grams > 0.001) {
                addMetals[metal] = {
                    grams: grams,
                    label: METAL_INFO[metal]?.fullName || metal,
                };
            }
        }

        // Final alloy composition
        for (const [metal, percent] of Object.entries(alloyTarget)) {
            results[metal] = {
                grams: totalWeight * (percent / 100),
                percent: percent,
            };
        }
    }

    return {
        totalWeight,
        results,
        karat: karatTo,
        karatFrom,
        color,
        mode: 'convert',
        direction: karatTo > karatFrom ? 'up' : 'down',
        addMetals,
        goldInMaterial,
        materialWeight: weight,
    };
}

/**
 * Finds the closest karat available in DB for a specific color to use as a base for proportions.
 */
function findClosestKarat(karat, color) {
    const availableKarats = Object.keys(ALLOY_DB)
        .filter(k => ALLOY_DB[k][color])
        .map(Number);

    if (availableKarats.length === 0) return 18; // Default fallback

    return availableKarats.reduce((prev, curr) =>
        Math.abs(curr - karat) < Math.abs(prev - karat) ? curr : prev
    );
}

// ============================================
// UI RENDERING
// ============================================
function renderResults(data) {
    if (!data) {
        showError('Combinación no disponible');
        return;
    }

    els.resultsEmpty.classList.add('hidden');
    els.resultsContent.classList.remove('hidden');

    // Conversion info banner
    if (data.mode === 'convert') {
        els.convertInfoBanner.classList.remove('hidden');
        const arrow = data.direction === 'up' ? '↑' : '↓';
        els.convertInfoText.textContent = `${data.karatFrom}K ${arrow} ${data.karat}K ${COLOR_NAMES[data.color]}`;

        // Show add section
        els.addSection.classList.remove('hidden');
        els.addItems.innerHTML = '';
        for (const [metal, info] of Object.entries(data.addMetals)) {
            const metalData = METAL_INFO[metal];
            const item = document.createElement('div');
            item.className = 'add-item';
            item.innerHTML = `
                <div class="add-item-icon" style="background: ${metalData.color}">
                    <span>${metalData.symbol}</span>
                </div>
                <div class="add-item-info">
                    <span class="add-item-name">${info.label}</span>
                    <span class="add-item-note">Agregar al material existente</span>
                </div>
                <div class="add-item-weight">${info.grams.toFixed(2)}g</div>
            `;
            els.addItems.appendChild(item);
        }
    } else {
        els.convertInfoBanner.classList.add('hidden');
        els.addSection.classList.add('hidden');
    }

    // Summary
    els.summaryAlloy.textContent = `${data.karat}K ${COLOR_NAMES[data.color]}`;
    els.summaryTotal.textContent = `${data.totalWeight.toFixed(2)}g`;
    els.summaryPurity.textContent = `${(data.karat / 24 * 100).toFixed(1)}%`;

    // Metal cards
    els.metalsBreakdown.innerHTML = '';
    const metals = Object.entries(data.results).filter(([_, v]) => v.percent > 0);

    metals.forEach(([metal, info]) => {
        const metalData = METAL_INFO[metal];
        const card = document.createElement('div');
        card.className = 'metal-card';
        card.innerHTML = `
            <div class="metal-symbol" style="background: ${metalData.color}">
                ${metalData.symbol}
            </div>
            <div class="metal-info">
                <span class="metal-name">${metalData.name}</span>
                <div class="metal-bar-container">
                    <div class="metal-bar" style="width: 0%; background: ${metalData.color}"></div>
                </div>
            </div>
            <div class="metal-values">
                <div class="metal-weight">${info.grams.toFixed(2)}g</div>
                <div class="metal-percent">${info.percent.toFixed(2)}%</div>
            </div>
        `;
        els.metalsBreakdown.appendChild(card);

        requestAnimationFrame(() => {
            setTimeout(() => {
                card.querySelector('.metal-bar').style.width = `${info.percent}%`;
            }, 100);
        });
    });

    // Proportion bar
    els.proportionBar.innerHTML = '';
    els.proportionLegend.innerHTML = '';

    metals.forEach(([metal, info]) => {
        const metalData = METAL_INFO[metal];

        const segment = document.createElement('div');
        segment.className = 'proportion-segment';
        segment.style.width = '0%';
        segment.style.background = metalData.color;
        segment.title = `${metalData.fullName}: ${info.percent.toFixed(2)}%`;
        els.proportionBar.appendChild(segment);

        requestAnimationFrame(() => {
            setTimeout(() => {
                segment.style.width = `${info.percent}%`;
            }, 200);
        });

        const legend = document.createElement('div');
        legend.className = 'legend-item';
        legend.innerHTML = `
            <span class="legend-dot" style="background: ${metalData.color}"></span>
            ${metalData.fullName} ${info.percent.toFixed(1)}%
        `;
        els.proportionLegend.appendChild(legend);
    });

    // Re-trigger animations
    els.resultsContent.style.animation = 'none';
    els.resultsContent.offsetHeight;
    els.resultsContent.style.animation = '';
}

function showError(msg) {
    els.resultsEmpty.classList.remove('hidden');
    els.resultsContent.classList.add('hidden');
    els.resultsEmpty.querySelector('p').innerHTML = `<strong style="color: #ff6b6b;">${msg}</strong>`;
    els.resultsEmpty.querySelector('.empty-hint').textContent = 'Prueba otra combinación de kilate y color';
}

function resetError() {
    els.resultsEmpty.querySelector('p').innerHTML = 'Ingresa los parámetros y presiona <strong>Calcular</strong>';
    els.resultsEmpty.querySelector('.empty-hint').textContent = 'Los resultados aparecerán aquí';
}

// ============================================
// COLOR AVAILABILITY
// ============================================
function updateColorAvailability() {
    const availableColors = ALLOY_DB[state.karat] ? Object.keys(ALLOY_DB[state.karat]) : [];

    $$('.color-btn').forEach(btn => {
        const color = btn.dataset.color;
        if (availableColors.includes(color)) {
            btn.classList.remove('disabled');
        } else {
            btn.classList.add('disabled');
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                if (availableColors.length > 0) {
                    state.color = availableColors[0];
                    $(`.color-btn[data-color="${availableColors[0]}"]`).classList.add('active');
                }
            }
        }
    });
}

// ============================================
// CONVERSION DIRECTION UI
// ============================================
function updateConvertDirection() {
    if (state.mode !== 'convert') return;

    const badge = els.directionBadge;
    const kFrom = state.karatFromManual;
    const kTo = state.karatManual;

    if (kFrom < kTo) {
        arrow.textContent = '↑';
        arrow.className = 'direction-arrow direction-up';
        text.textContent = 'Subir kilate — se agrega oro 24K puro';
        badge.className = 'convert-direction-badge direction-up';
    } else if (kFrom > kTo) {
        arrow.textContent = '↓';
        arrow.className = 'direction-arrow direction-down';
        text.textContent = 'Bajar kilate — se agrega liga (metales base)';
        badge.className = 'convert-direction-badge direction-down';
    } else {
        arrow.textContent = '=';
        arrow.className = 'direction-arrow direction-same';
        text.textContent = 'Mismo kilate — no necesita conversión';
        badge.className = 'convert-direction-badge direction-same';
    }
}

// ============================================
// REFERENCE TABLE
// ============================================
function populateReferenceTable() {
    const colorSwatches = {
        amarillo: 'linear-gradient(135deg, #FFD700, #DAA520)',
        rosa: 'linear-gradient(135deg, #E8A090, #C47A6A)',
        blanco: 'linear-gradient(135deg, #E8E8E8, #C0C0C0)',
        verde: 'linear-gradient(135deg, #C5D88A, #8FAE45)',
    };

    let html = '';
    for (const [karat, colors] of Object.entries(ALLOY_DB)) {
        for (const [color, composition] of Object.entries(colors)) {
            html += `<tr>
                <td><strong>${karat}K</strong></td>
                <td>${(parseInt(karat) / 24 * 100).toFixed(1)}%</td>
                <td><span class="color-indicator"><span class="color-dot" style="background: ${colorSwatches[color]}"></span> ${COLOR_NAMES[color]}</span></td>
                <td>${composition.Au?.toFixed(2) || '—'}%</td>
                <td>${composition.Ag?.toFixed(2) || '—'}%</td>
                <td>${composition.Cu?.toFixed(2) || '—'}%</td>
                <td>${composition.Zn?.toFixed(2) || '—'}%</td>
                <td>${composition.Pd?.toFixed(2) || '—'}%</td>
            </tr>`;
        }
    }
    els.referenceTbody.innerHTML = html;
}

// ============================================
// EVENT HANDLERS
// ============================================
function initEvents() {
    // Mode toggle
    els.modeAvailable.addEventListener('click', () => setMode('available'));
    els.modeTarget.addEventListener('click', () => setMode('target'));
    els.modeConvert.addEventListener('click', () => setMode('convert'));

    // Target karat selection
    $$('.karat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('.karat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.karat = btn.dataset.karat;

            if (state.karat === 'custom') {
                els.targetCustomInputWrapper.classList.remove('hidden');
                state.karatManual = parseFloat(els.targetKaratManual.value) || 18;
            } else {
                els.targetCustomInputWrapper.classList.add('hidden');
                state.karatManual = parseInt(state.karat);
            }

            updateColorAvailability();
            updateConvertDirection();
        });
    });

    // Source karat selection (convert mode)
    $$('.source-karat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('.source-karat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.karatFrom = btn.dataset.karat;

            if (state.karatFrom === 'custom') {
                els.sourceCustomInputWrapper.classList.remove('hidden');
                state.karatFromManual = parseFloat(els.sourceKaratManual.value) || 16;
            } else {
                els.sourceCustomInputWrapper.classList.add('hidden');
                state.karatFromManual = parseInt(state.karatFrom);
            }

            updateConvertDirection();
        });
    });

    // Manual input listeners
    els.targetKaratManual.addEventListener('input', () => {
        state.karatManual = parseFloat(els.targetKaratManual.value) || 0;
        updateColorAvailability();
        updateConvertDirection();
    });

    els.sourceKaratManual.addEventListener('input', () => {
        state.karatFromManual = parseFloat(els.sourceKaratManual.value) || 0;
        updateConvertDirection();
    });

    // Color selection
    $$('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('disabled')) return;
            $$('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.color = btn.dataset.color;
        });
    });

    // Calculate
    els.btnCalculate.addEventListener('click', handleCalculate);

    // Enter key
    els.weightInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleCalculate();
    });

    // Print
    els.btnPrint.addEventListener('click', () => window.print());

    // Reference table
    els.btnReference.addEventListener('click', () => {
        populateReferenceTable();
        els.modalOverlay.classList.remove('hidden');
    });

    // Modal close
    els.modalClose.addEventListener('click', () => els.modalOverlay.classList.add('hidden'));
    els.modalOverlay.addEventListener('click', (e) => {
        if (e.target === els.modalOverlay) els.modalOverlay.classList.add('hidden');
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') els.modalOverlay.classList.add('hidden');
    });
}

function setMode(mode) {
    state.mode = mode;
    els.modeAvailable.classList.toggle('active', mode === 'available');
    els.modeTarget.classList.toggle('active', mode === 'target');
    els.modeConvert.classList.toggle('active', mode === 'convert');

    // Show/hide source karat panel
    if (mode === 'convert') {
        els.sourceKaratGroup.classList.remove('hidden');
        els.weightLabel.textContent = 'Peso del material actual (gramos)';
        els.weightInput.placeholder = 'Ej: 10.00';
        els.targetKaratLabel.textContent = 'Kilate Objetivo (convertir a)';
        updateConvertDirection();
    } else {
        els.sourceKaratGroup.classList.add('hidden');
        els.targetKaratLabel.textContent = 'Kilate Objetivo';

        if (mode === 'available') {
            els.weightLabel.textContent = 'Oro 24K disponible (gramos)';
            els.weightInput.placeholder = 'Ej: 10.00';
        } else {
            els.weightLabel.textContent = 'Peso final deseado (gramos)';
            els.weightInput.placeholder = 'Ej: 20.00';
        }
    }
}

function handleCalculate() {
    const weight = parseFloat(els.weightInput.value);

    if (!weight || weight <= 0) {
        els.weightInput.focus();
        els.weightInput.style.borderColor = '#ff6b6b';
        setTimeout(() => {
            els.weightInput.style.borderColor = '';
        }, 1500);
        return;
    }

    resetError();

    let result;
    if (state.mode === 'convert') {
        if (state.karatFromManual === state.karatManual) {
            showError('El kilate de origen y destino son iguales');
            return;
        }
        if (state.karatFromManual <= 0 || state.karatManual <= 0 || state.karatFromManual > 24 || state.karatManual > 24) {
            showError('Kilates inválidos (deben estar entre 1 y 24)');
            return;
        }
        result = calculateConversion(weight, state.karatFromManual, state.karatManual, state.color);
    } else {
        if (state.karatManual <= 0 || state.karatManual > 24) {
            showError('Kilate inválido (debe estar entre 1 y 24)');
            return;
        }
        result = calculateAlloy(weight, state.karatManual, state.color, state.mode);
    }

    renderResults(result);
}

// ============================================
// FLOATING PARTICLES
// ============================================
function createParticles() {
    const container = document.getElementById('particles-bg');
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 8 + 's';
        particle.style.animationDuration = (6 + Math.random() * 6) + 's';
        particle.style.width = (2 + Math.random() * 4) + 'px';
        particle.style.height = particle.style.width;
        container.appendChild(particle);
    }
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initEvents();
    updateColorAvailability();
    createParticles();
});

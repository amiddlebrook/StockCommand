import { Ticker } from './types';

export const UNIVERSE: Ticker[] = [
    // Core Tech
    { symbol: 'NVDA', sleeve: 'Core Tech', role: 'Hardware and system reference architectures' },
    { symbol: 'AMD', sleeve: 'Core Tech', role: 'Hardware and system reference architectures' },
    { symbol: 'GOOG', sleeve: 'Core Tech', role: 'Cloud compute, data platforms, and infra' },
    { symbol: 'AMZN', sleeve: 'Core Tech', role: 'Cloud compute, data platforms, and infra' },
    { symbol: 'MSFT', sleeve: 'Core Tech', role: 'Cloud compute, data platforms, and infra' },
    { symbol: 'AVGO', sleeve: 'Core Tech', role: 'System-level toll collector' },
    { symbol: 'CRWD', sleeve: 'Core Tech', role: 'Security and zero-trust' },
    { symbol: 'ZS', sleeve: 'Core Tech', role: 'Security and zero-trust' },
    { symbol: 'EQIX', sleeve: 'Core Tech', role: 'Physical data centers and interconnects' },

    // Rotatable Tech
    { symbol: 'NET', sleeve: 'Rotatable Tech', role: 'Edge networks' },
    { symbol: 'FSLY', sleeve: 'Rotatable Tech', role: 'Edge networks' },
    { symbol: 'ANET', sleeve: 'Rotatable Tech', role: 'Data infra' },
    { symbol: 'MU', sleeve: 'Rotatable Tech', role: 'Memory' },
    { symbol: 'WDC', sleeve: 'Rotatable Tech', role: 'Storage' },
    { symbol: 'STX', sleeve: 'Rotatable Tech', role: 'Storage' },
    { symbol: 'ESTC', sleeve: 'Rotatable Tech', role: 'Data search/observability' },
    { symbol: 'CFLT', sleeve: 'Rotatable Tech', role: 'Data streaming' },
    { symbol: 'CGNX', sleeve: 'Rotatable Tech', role: 'Vision' },
    { symbol: 'ATEN', sleeve: 'Rotatable Tech', role: 'Connectivity' },
    { symbol: 'OPRA', sleeve: 'Rotatable Tech', role: 'Browser/AI' },
    { symbol: 'VEEV', sleeve: 'Rotatable Tech', role: 'SaaS' },
    { symbol: 'SNOW', sleeve: 'Rotatable Tech', role: 'Data cloud' },
    { symbol: 'MDB', sleeve: 'Rotatable Tech', role: 'Database' },

    // Specialized: Energy
    { symbol: 'AR', sleeve: 'Specialized: Energy', role: 'Natural gas cycle' },
    { symbol: 'EGY', sleeve: 'Specialized: Energy', role: 'Oil exposure' },
    { symbol: 'UEC', sleeve: 'Specialized: Energy', role: 'Uranium mining' },
    { symbol: 'SXC', sleeve: 'Specialized: Energy', role: 'Coal' },
    { symbol: 'WMB', sleeve: 'Specialized: Energy', role: 'Natural gas pipelines' },
    { symbol: 'CCJ', sleeve: 'Specialized: Energy', role: 'Uranium fuel cycle' },

    // Specialized: AI Infra
    { symbol: 'VRT', sleeve: 'Specialized: AI Infra', role: 'Power and thermal' },
    { symbol: 'APH', sleeve: 'Specialized: AI Infra', role: 'Connectors' },
    { symbol: 'UMAC', sleeve: 'Specialized: AI Infra', role: 'Industrial/Service' },
    { symbol: 'SERV', sleeve: 'Specialized: AI Infra', role: 'Industrial/Service' },
    { symbol: 'PWR', sleeve: 'Specialized: AI Infra', role: 'Grid buildout' },
    { symbol: 'ETN', sleeve: 'Specialized: AI Infra', role: 'Electrical equipment' },
    { symbol: 'TT', sleeve: 'Specialized: AI Infra', role: 'HVAC' },
    { symbol: 'IRM', sleeve: 'Specialized: AI Infra', role: 'Physical storage' },

    // Specialized: Insurance
    { symbol: 'CB', sleeve: 'Specialized: Insurance', role: 'Catastrophe/Capital cycle' },
    { symbol: 'RNR', sleeve: 'Specialized: Insurance', role: 'Reinsurance' },
    { symbol: 'WRB', sleeve: 'Specialized: Insurance', role: 'Insurance' },
    { symbol: 'AON', sleeve: 'Specialized: Insurance', role: 'Broker' },
    { symbol: 'EG', sleeve: 'Specialized: Insurance', role: 'Insurance' },
    { symbol: 'AXS', sleeve: 'Specialized: Insurance', role: 'Insurance' },

    // Specialized: Defense
    { symbol: 'LMT', sleeve: 'Specialized: Defense', role: 'Defense prime' },
    { symbol: 'NOC', sleeve: 'Specialized: Defense', role: 'Defense prime' },
    { symbol: 'GD', sleeve: 'Specialized: Defense', role: 'Defense prime' },
    { symbol: 'KTOS', sleeve: 'Specialized: Defense', role: 'Defense tech' },
    { symbol: 'AVAV', sleeve: 'Specialized: Defense', role: 'Drones' },
    { symbol: 'HII', sleeve: 'Specialized: Defense', role: 'Shipbuilding' },
    { symbol: 'MRCY', sleeve: 'Specialized: Defense', role: 'Defense electronics' },
    { symbol: 'OSIS', sleeve: 'Specialized: Defense', role: 'Security' },
    { symbol: 'CW', sleeve: 'Specialized: Defense', role: 'Industrial defense' },
    { symbol: 'PLTR', sleeve: 'Specialized: Defense', role: 'Defense software' },

    // Specialized: Utilities/Water
    { symbol: 'NEE', sleeve: 'Specialized: Utilities/Water', role: 'Power utility' },
    { symbol: 'DUK', sleeve: 'Specialized: Utilities/Water', role: 'Power utility' },
    { symbol: 'AWK', sleeve: 'Specialized: Utilities/Water', role: 'Water utility' },
    { symbol: 'CEG', sleeve: 'Specialized: Utilities/Water', role: 'Nuclear/Power' },
    { symbol: 'VST', sleeve: 'Specialized: Utilities/Water', role: 'Power generation' },
    { symbol: 'NRG', sleeve: 'Specialized: Utilities/Water', role: 'Power generation' },
    { symbol: 'XYL', sleeve: 'Specialized: Utilities/Water', role: 'Water tech' },
    { symbol: 'PNR', sleeve: 'Specialized: Utilities/Water', role: 'Water tech' },
    { symbol: 'AWR', sleeve: 'Specialized: Utilities/Water', role: 'Water utility' },
    { symbol: 'CWT', sleeve: 'Specialized: Utilities/Water', role: 'Water utility' },

    // Specialized: Royalties
    { symbol: 'FNV', sleeve: 'Specialized: Royalties', role: 'Gold royalties' },
    { symbol: 'WPM', sleeve: 'Specialized: Royalties', role: 'PM streaming' },
    { symbol: 'VNOM', sleeve: 'Specialized: Royalties', role: 'Mineral rights' },

    // Specialized: Health Services
    { symbol: 'UNH', sleeve: 'Specialized: Health Services', role: 'Managed care' },
    { symbol: 'HCA', sleeve: 'Specialized: Health Services', role: 'Hospitals' },
    { symbol: 'SYK', sleeve: 'Specialized: Health Services', role: 'MedTech' },
    { symbol: 'DGX', sleeve: 'Specialized: Health Services', role: 'Diagnostics' },
    { symbol: 'BSX', sleeve: 'Specialized: Health Services', role: 'MedTech' },
    { symbol: 'LH', sleeve: 'Specialized: Health Services', role: 'Diagnostics' },

    // Specialized: Biotech
    { symbol: 'OMER', sleeve: 'Specialized: Biotech', role: 'Biotech' },
    { symbol: 'NUVB', sleeve: 'Specialized: Biotech', role: 'Biotech' },
    { symbol: 'TNGX', sleeve: 'Specialized: Biotech', role: 'Biotech' },
    { symbol: 'AVAH', sleeve: 'Specialized: Biotech', role: 'Biotech' },
    { symbol: 'VRTX', sleeve: 'Specialized: Biotech', role: 'Biotech' },

    // Specialized: Digital Rails
    { symbol: 'BTC', sleeve: 'Specialized: Digital Rails', role: 'Store of value' },
    { symbol: 'ETH', sleeve: 'Specialized: Digital Rails', role: 'Smart contracts' },
    { symbol: 'LINK', sleeve: 'Specialized: Digital Rails', role: 'Oracle' },
    { symbol: 'FIL', sleeve: 'Specialized: Digital Rails', role: 'Decentralized storage' },
    { symbol: 'XRP', sleeve: 'Specialized: Digital Rails', role: 'Settlement' },

    // Specialized: Art
    { symbol: 'MASTERWORKS', sleeve: 'Specialized: Art', role: 'Blue-Chip Art' },
];

// Polyfill TextEncoder/TextDecoder — required by react-router v7 in jsdom
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import '@testing-library/jest-dom';

// jsdom doesn't implement scrollIntoView — stub it out
window.HTMLElement.prototype.scrollIntoView = jest.fn();

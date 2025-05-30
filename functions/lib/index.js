"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRazorpayPaymentFunction = exports.createRazorpayOrderFunction = exports.updateStudentApiKeyFunction = exports.registerStudentFunction = void 0;
const functions = __importStar(require("firebase-functions"));
const app_1 = require("firebase-admin/app");
const student_1 = require("./student");
const razorpay_1 = require("./razorpay");
// Initialize Firebase Admin
(0, app_1.initializeApp)();
exports.registerStudentFunction = functions.https.onRequest({
    memory: '256MiB',
    region: 'asia-south1'
}, (req, res) => {
    (0, student_1.registerStudent)(req, res);
});
exports.updateStudentApiKeyFunction = functions.https.onRequest({
    memory: '256MiB',
    region: 'asia-south1'
}, (req, res) => {
    (0, student_1.updateStudentApiKey)(req, res);
});
exports.createRazorpayOrderFunction = functions.https.onRequest({
    memory: '256MiB',
    region: 'asia-south1'
}, (req, res) => {
    (0, razorpay_1.createRazorpayOrder)(req, res);
});
exports.verifyRazorpayPaymentFunction = functions.https.onRequest({
    memory: '256MiB',
    region: 'asia-south1'
}, (req, res) => {
    (0, razorpay_1.verifyRazorpayPayment)(req, res);
});
//# sourceMappingURL=index.js.map
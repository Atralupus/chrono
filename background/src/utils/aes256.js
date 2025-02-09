// const crypto = require('crypto')
import keccak256 from "keccak256"
const IV_LENGTH = 16
export default {
    encrypt: async (text, passphrase) => {
        const key = await window.crypto.subtle.importKey("raw", Buffer.from(keccak256(passphrase)), {name: 'AES-CBC'}, true, ['encrypt', 'decrypt']);
        const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
        const encrypted = await window.crypto.subtle.encrypt({
            name: 'AES-CBC',
            iv,
            length: 256,
        }, key, Buffer.from(text));

        return (
            Buffer.from(iv).toString('hex') +
            ':' +
            Buffer.from(encrypted).toString('hex')
        )
    },
    decrypt: async (text, passphrase) => {
        const textParts = text.split(':')
        const iv = Buffer.from(textParts.shift(), 'hex')
        const encryptedText = Buffer.from(textParts.join(':'), 'hex')
        const key = await window.crypto.subtle.importKey("raw", Buffer.from(keccak256(passphrase)), {name: 'AES-CBC'}, true, ['encrypt', 'decrypt']);
        const decrypted = await window.crypto.subtle.decrypt({
            name: 'AES-CBC',
            iv,
            length: 256,
        }, key, encryptedText);

        return Buffer.from(decrypted).toString()
    }
}
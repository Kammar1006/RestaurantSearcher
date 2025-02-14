/*
    Created by Kammar1006
*/

const isAlnum = (data) => {
    if (typeof data !== 'string') return false;
    return !!data.match(/^[A-Za-z0-9]+$/);
}

const isEmail = (data) => {
    if (typeof data !== 'string') return false;
    return !!data.match(/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/);
}

const isLen = (data, a, b) => {
    return (a <= data.length && data.length <= b) ? true : false;
}

module.exports = {isAlnum, isEmail, isLen};
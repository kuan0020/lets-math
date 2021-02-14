// Initialize calculator object
const calculator = {
    screenVal: '0', // Current value on the display screen
    leftVal: null, // Current Left Operand 
    rightValStatus: false, // Boolean value, true if both Left Operand and operator are ready
    operator: null, // Current Operator
};

// Updates calculator display screen with the current screenVal in calculator object
function updateDisplay() {
    const display = document.querySelector('.calc-screen');
    sV_str = String(calculator.screenVal)

    // Always leave the screen with 0 if there are no values
    if (sV_str == '') {
        calculator.screenVal = '0';
    }

    // Change html value to screenVal
    display.value = calculator.screenVal;
}

// Handle digit inputs
function handleDigit(digit) {
    // Grab current status
    const { screenVal, rightValStatus } = calculator;

    // Replace screenVal with Right values if both Left & Operator are ready
    if (rightValStatus === true) {
        calculator.screenVal = digit;

        // Changes the sign of screenVal
        if (digit === 'negate') {
            calculator.screenVal = parseFloat(screenVal) * -1
        }

        calculator.rightValStatus = false;
    } else {
        // Replace '0' to current input
        if (screenVal === '0') {

            // screenVal stays 0 if we negates 0
            if (digit === 'negate') {
                calculator.screenVal = '0'
                return;
            }

            calculator.screenVal = digit;
        }

        // Append digits to current screenVal if either Left or Operator is not ready
        else {

            // Changes sign of current screenVal
            if (digit === 'negate') {
                calculator.screenVal = parseFloat(screenVal) * -1
                return;
            }

            calculator.screenVal = screenVal + digit;

        }
    }
}

// Handle decimal point
function handleDot() {
    // Case where the Left & Operator is ready, Right starts with 0.
    if (calculator.rightValStatus === true) {
        calculator.screenVal = "0."
        calculator.rightValStatus = false;
        return;
    }

    // Only append '.' to the display screen for the first '.'
    if (calculator.screenVal.indexOf('.') === -1) {
        calculator.screenVal += '.';
    }
}

// Backspace digits
function delDigit() {
    sV_str = String(calculator.screenVal)

    // Delete the last digit if screenVal != 0
    if (sV_str != '0') {
        calculator.screenVal = sV_str.substring(0, sV_str.length - 1);

        // Always leave the screen with 0 if there are no values
        if (sV_str == '') {
            calculator.screenVal = '0';
        }
    }

    // Update Left with the new screenVal
    calculator.leftVal = parseFloat(calculator.screenVal)
}

// Math operations, takes in Left, Right and operator to act on them
function calculate(leftVal, rightVal, operator) {
    // Different cases
    if (operator === '+') {
        return leftVal + rightVal; // adds Left and Right
    } else if (operator === '-') {
        return leftVal - rightVal; // subtract Right from Left
    } else if (operator === '*') {
        return leftVal * rightVal; // multiply Left and Right
    } else if (operator === '/') {
        return leftVal / rightVal; // divide Left and Right
    } else if (operator === '%') {
        return leftVal % rightVal; // modulus of Left and Right, returns the remainder of Left divide Right
    }

    return rightVal;
}

// Handles all the dynamics of operators
function handleOperator(newOperator) {
    var server = 'http://' + document.domain + ':' + location.port; // server location
    const { leftVal, screenVal, operator } = calculator
    const sV_flt = parseFloat(screenVal);
    var op_num = { 'op_num': [0, 0, 0, 0] }; // Relevant numbers from the operation, {'op_num':[leftVal, operator, rightVal, result]}

    // Set calculator.operator as the most recent operator clicked
    if (operator && calculator.rightValStatus) {
        calculator.operator = newOperator;
        return;
    }

    // Whenever calculator.leftVal = null, set leftVal to current screenVal
    if (leftVal == null) {
        calculator.leftVal = sV_flt;
    }

    // If operator != null
    else if (operator) {
        const result = calculate(leftVal, sV_flt, operator); // Calculate depending on which operator
        op_num['op_num'] = [calculator.leftVal, operator, sV_flt, result]; // update op_num
        var appdir = "/calculation" // Python Flask route, op_num will be passed to that route

        // Sends op_num to Python Flask as a json
        $.ajax({
            type: "POST",
            url: server + appdir,
            data: encodeURIComponent(JSON.stringify(op_num)),
            dataType: 'json'
        })

        op_num = { 'op_num': [0, 0, 0, 0] }; // reset op_sum

        var socket = io.connect('http://' + document.domain + ':' + location.port); // socketio connect 

        socket.on('connect', function() {
            // emit to "calc event"
            socket.emit('calc event', {
                data: 'User Connected',
                user_name: $('input.username').val()
            })
        })

        calculator.screenVal = parseFloat(result.toFixed(10)); // Only show 10 digits on screen
        calculator.leftVal = parseFloat(result); // Update leftVal with the new result
    }

    calculator.rightValStatus = true; // reset rightValStatus to listen for most recent operator clicked
    calculator.operator = newOperator; // update operator
}

// Resets the calculator object to the initialized values
function resetCalculator() {
    calculator.screenVal = '0';
    calculator.leftVal = null;
    calculator.rightValStatus = false;
    calculator.operator = null;
}


// Start here
updateDisplay();

const keys = document.querySelector('.calculator-keys'); // find all HTML Elements in the .calculator-keys div
var socket = io.connect('http://' + document.domain + ':' + location.port); // server location

// Update the calculation history by adding most recent calculations to the top of the list
socket.on('message', function(msg) {
    var ul = document.getElementById("events");
    var li = document.createElement("li");
    var children = ul.children.length + 1
    li.setAttribute("id", "element" + children)
    li.insertBefore(document.createTextNode(msg), li.childNodes[0]);
    ul.insertBefore(li, ul.childNodes[0])
})

// Listen for button clicks
keys.addEventListener('click', (event) => {
    const { target } = event;

    // Do nothing if event is not a button click
    if (!target.matches('button')) {
        return;
    }

    // Handle Operator events if an operator is clicked
    if (target.classList.contains('operator')) {
        handleOperator(target.value);
        updateDisplay();
        return;
    }

    // Handle decimal events if the dot is clicked
    if (target.classList.contains('decimal')) {
        handleDot(target.value);
        updateDisplay();
        return;
    }

    // Reset Calculator if AC is clicked
    if (target.classList.contains('resetC')) {
        resetCalculator();
        updateDisplay();
        return;
    }

    // Handle backspacing events if backspace is clicked
    if (target.classList.contains('del-digit')) {
        delDigit();
        updateDisplay();
        return;
    }

    // Handles digit events
    handleDigit(target.value);
    updateDisplay();
});
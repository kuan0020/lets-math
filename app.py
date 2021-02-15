from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, send
from flask_sqlalchemy import SQLAlchemy
import re 
import json
import os

# Initialize Flask app, sqlite3 db, and socketio
app = Flask(__name__)
# app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
socketio = SocketIO(app)

db = SQLAlchemy(app)

# Checks length of int
def numLen(num):
  return len(str(abs(num)))
class History(db.Model):
    id = db.Column('id', db.Integer, primary_key=True)
    message = db.Column('message', db.String(500))

data = {'op_num':[0,'=',0,0]}

# Default route with most recent 10 calculation messages
@app.route('/', methods=['GET', 'POST'])
def main():
    msg_hist = db.session.query(History).order_by(History.id.desc()).limit(10)
    return render_template('index.html', messages=msg_hist)

# Grabs op_num json from main.js 
@app.route('/calculation', methods=['POST'])
def calculate():
    global data
    rf = request.form
    
    for key in rf.keys():
        data = json.loads(key)
    
    return render_template('index.html')

# Broadcast every calculations received
@socketio.on('calc event')
def handle_calc_event(json, methods=['GET', 'POST']):
    global data
    
    left, op, right, res = data['op_num']

    if op == '*':
        op = '×'
    if op == '/':
        op = '÷'
    
    left = round(left, 7)
    right = round(right, 7)
    res = round(res, 7)
    
    if type(left) == int and numLen(left) >= 7:
        left = '{:.2e}'.format(left)
        
    if type(right) == int and numLen(right) >= 7:
        right = '{:.2e}'.format(right)
    
    if type(res) == int and numLen(res) >= 7:
        res = '{:.2e}'.format(res)
    
    if json['user_name'] == '':
        json['user_name'] = 'Anonymous'
    
    if op != '=':
        msg = '{user}: {l} {op} {r} = {res}'.format(user=json['user_name'], l=str(left), op=str(op), r=str(right), res=str(res))
        msg_hist = History(message=msg)
        db.session.add(msg_hist)
        db.session.commit()
        
        send(msg, broadcast=True)
    else:
        pass
    
if __name__ == '__main__':
    app.run()
/*
 * Copyright (c) 2024 Numurus, LLC <https://www.numurus.com>.
 *
 * This file is part of nepi-engine
 * (see https://github.com/nepi-engine).
 *
 * License: 3-clause BSD, see https://opensource.org/licenses/BSD-3-Clause
 */


import React, { Component } from "react"
import { observer, inject } from "mobx-react"
import Select, { Option } from "./Select"
import Styles from "./Styles"


/////////////////////////////
// MISC FUNCTIONS

export function doNothing(){
  var ret = false
  return ret
}

export function round(value, decimals = 0) {
  return Number(value).toFixed(decimals)
  //return value && Number(Math.round(value + "e" + decimals) + "e-" + decimals)
}

export function convertStrToStrList(inputStr) {
  var strList = []
  if (inputStr != null){
    inputStr = inputStr.replaceAll("[","")
    inputStr = inputStr.replaceAll("]","")
    inputStr = inputStr.replaceAll(" '","")
    inputStr = inputStr.replaceAll("'","")
    strList = inputStr.split(",")
  }
  return strList
}

export function filterStrList(inputList,filterList) {
  var outputList = []
  for (var i = 0; i < inputList.length; ++i) {
    var filter_check = false
    for (var j = 0; j < filterList.length; ++j) {
      if (inputList[i].indexOf(filterList[j]) !== -1) {
        filter_check = true
      }
    }
    if (filter_check === false){
      outputList.push(inputList[i])
    }
  }
  return outputList
}


export class Queue {
  constructor() {
      this.items = []
      this.frontIndex = 0
      this.backIndex = 0
  }
  pushItem(item) {
      this.items[this.backIndex] = item
      this.backIndex++
      return item + ' inserted'
  }
  pullItem() {
      const item = this.items[this.frontIndex]
      delete this.items[this.frontIndex]
      this.frontIndex++
      return item
  }
  getItems(){
    return this.items
  }
  getItemsReversed(){
    var itemsReversed = []
    const itemsLength = this.items.length
    var rev_index = itemsLength - 1
    for (var i = 0; i < this.items.length; i++) {
      itemsReversed.push(this.items[rev_index])
      rev_index = rev_index - 1
    }
    return itemsReversed
  }
  getLength(){
    return this.items.length
  }
  peek() {
      return this.items[this.frontIndex]
  }
  get printQueue() {
      return this.items;
  }
}

/////////////////////////////
// TOGGLE FUNCTIONS

export function onChangeSwitchStateValue(stateVarNameStr,currentVal){
  var key = stateVarNameStr
  var value = currentVal === false
  var obj  = {}
  obj[key] = value
  this.setState(obj)
}


/////////////////////////////
// MENU FUNCTIONS

export function createShortValues(list) {
  var tokenizedList = []
  var depthsToShort = 2
  var shortList = []
  for (var i = 0; i < list.length; ++i) {
    tokenizedList.push(list[i].split("/").reverse())
  }
  // Now create the return list
  for (i = 0; i < tokenizedList.length; ++i) {
    shortList.push(tokenizedList[i].slice(0, depthsToShort).reverse().join("/"))
  }
  return shortList
}

export function createShortUniqueValues(list) {
  var tokenizedList = []
  var depthsToUnique = []
  var uniqueList = []
  for (var i = 0; i < list.length; ++i) {
    tokenizedList.push(list[i].split("/").reverse())
    depthsToUnique.push(1)
    const newItemIndex = tokenizedList.length - 1 
    for (var j = 0; j < tokenizedList.length - 1; ++j) {
      var currentTestDepth = 0
      while (tokenizedList[j][currentTestDepth] === tokenizedList[newItemIndex][currentTestDepth]) {
        currentTestDepth += 1
        if (currentTestDepth >= depthsToUnique[j]) {
          depthsToUnique[j] += 1
        }
        if (currentTestDepth >= depthsToUnique[newItemIndex]) {
          depthsToUnique[newItemIndex] += 1
        }
      }
    }
  }
  // Now create the return list
  for (i = 0; i < tokenizedList.length; ++i) {
    uniqueList.push(tokenizedList[i].slice(0, depthsToUnique[i]).reverse().join("/"))
  }
  return uniqueList
}


export function createShortValuesFromNamespaces(inputList) {
  var tokenizedList = []
  var outputList = []
  var shortName = ''
  for (var i = 0; i < inputList.length; ++i) {
      tokenizedList = inputList[i].split("/")
      var tokens_len = tokenizedList.length
      shortName = tokenizedList[tokens_len-3] + "/" + tokenizedList[tokens_len-1]
      outputList.push(shortName)
  }
  return outputList
}


export function createMenuListFromStrList(optionsStrList, useShortNames, filterOut, prefixOptionsStrList, appendOptionsStrList) {
  var filteredTopics = []
  var i
  var filteredTopics = []
  if (filterOut) {
    for (i = 0; i < optionsStrList.length; i++) {
        if (filterOut.includes(optionsStrList[i]) === false){
          filteredTopics.push(optionsStrList[i])
        }
    }
  }
  var unique_names = null
  if (useShortNames === true){
    unique_names = createShortValuesFromNamespaces(filteredTopics)
  } 
  else{
    unique_names = filteredTopics
  }
  var menuList = []
  for (i = 0; i < prefixOptionsStrList.length; i++) {
      let option = prefixOptionsStrList[i]
      menuList.push(<Option value={option}>{option}</Option>)
  }

  for (i = 0; i < filteredTopics.length; i++) {
    menuList.push(<Option value={filteredTopics[i]}>{unique_names[i]}</Option>)
  }

  for (i = 0; i < appendOptionsStrList.length; i++) {
    let option = appendOptionsStrList[i]
    menuList.push(<Option value={option}>{option}</Option>)
  }

   return menuList
}


export function onDropdownSelectedSetState(event, stateVarStr) {
  var key = stateVarStr
  var value = event.target.value
  var obj  = {}
  obj[key] = value
  this.setState(obj)
}

export function onDropdownSelectedSendStr(event, namespace) {
  const {sendStringMsg} = this.props.ros
  const value = event.target.value
  sendStringMsg(namespace,value)
}

export function onDropdownSelectedSendIndex(event, namespace) {
  const {sendIntMsg} = this.props.ros
  const value = event.target.value
  if (value !== "None") {
    const index = event.target.selectedIndex
    sendIntMsg(namespace,index)
  }
}

export function onDropdownSelectedSendIndex8(event, namespace) {
  const {sendInt8Msg} = this.props.ros
  const value = event.target.value
  if (value !== "None") {
    const index = event.target.selectedIndex
    sendInt8Msg(namespace,index)
  }
}


/////////////////////////////
// INPUT BOX FUNCTIONS

export function onUpdateSetStateValue(event,stateVarStr) {
  var key = stateVarStr
  var value = event.target.value
  var obj  = {}
  obj[key] = value
  this.setState(obj)
  document.getElementById(event.target.id).style.color = Styles.vars.colors.red
  this.render()
}



export function onEnterSendIntValue(event, namespace) {
  const {sendIntMsg} = this.props.ros
  if(event.key === 'Enter'){
    const value = parseInt(event.target.value)
    if (!isNaN(value)){
      sendIntMsg(namespace,value)
    }
    document.getElementById(event.target.id).style.color = Styles.vars.colors.black
  }
}


export function onEnterSendFloatValue(event, namespace) {
  const {sendFloatMsg} = this.props.ros
  if(event.key === 'Enter'){
    const value = parseFloat(event.target.value)
    if (!isNaN(value)){
      sendFloatMsg(namespace,value)
    }
    document.getElementById(event.target.id).style.color = Styles.vars.colors.black
  }
}

export function onEnterSetStateFloatValue(event, stateVarStr) {
  if(event.key === 'Enter'){
    const value = parseFloat(event.target.value)
    if (!isNaN(value)){
      var key = stateVarStr
      var obj  = {}
      obj[key] = value
      this.setState(obj)
    }
    document.getElementById(event.target.id).style.color = Styles.vars.colors.black
  }
}



/////////////////////////////
// STYLE FUNCTIONS
export function setElementStyleModified(e) {
  e.style.color = Styles.vars.colors.red
  e.style.fontWeight = "bold"
}

export function clearElementStyleModified(e) {
  e.style.color = Styles.vars.colors.black
  e.style.fontWeight = "normal"
}


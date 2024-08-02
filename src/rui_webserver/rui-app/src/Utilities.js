/*
 * Copyright (c) 2024 Numurus, LLC <https://www.numurus.com>.
 *
 * This file is part of nepi-engine
 * (see https://github.com/nepi-engine).
 *
 * License: 3-clause BSD, see https://opensource.org/licenses/BSD-3-Clause
 */
import Styles from "./Styles"

const createShortUniqueValues = list => {
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

export const createShortValues = list => {
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

export const createShortValuesFromNamespace = list => {
  var tokenizedList = []
  var shortList = []
  var shortName = ''
  for (var i = 0; i < list.length; ++i) {
    tokenizedList = list[i].split("/")
    var list_len = tokenizedList.length
    shortName = tokenizedList[list_len-3] + "/" + tokenizedList[list_len-3]
    shortList.push(shortName)
  }
  return shortList
}


export function setElementStyleModified(e) {
  e.style.color = Styles.vars.colors.red
  e.style.fontWeight = "bold"
}

export function clearElementStyleModified(e) {
  e.style.color = Styles.vars.colors.black
  e.style.fontWeight = "normal"
}



/*
// Function for creating short unique values from a list
// of strings, used to reduce topic names for display
const createShortUniqueValues = list => {
  var uniqueList = []
  var depth = 0
  var unique = false

  while (!unique) {
    uniqueList = []
    depth += 1
    unique = true

    for (var i = 0; i < list.length && unique; i++) {
      var parts = list[i].split("/")
      var newParts = []
      for (var j = 0; j < depth && j < parts.length; j++) {
        newParts.push(parts.pop())
      }

      var value = newParts.reverse().join("/")
      if (uniqueList.includes(value)) {
        // not unique
        unique = false
        continue
      } else {
        uniqueList.push(value)
      }
    }
  }
  return uniqueList
}
*/

export default createShortUniqueValues

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

export default createShortUniqueValues

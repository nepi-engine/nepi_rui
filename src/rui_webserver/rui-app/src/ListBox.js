/*
#
# Copyright (c) 2024 Numurus <https://www.numurus.com>.
#
# This file is part of nepi rui (nepi_rui) repo
# (see https://github.com/nepi-engine/nepi_rui)
#
# License: NEPI RUI repo source-code and NEPI Images that use this source-code
# are licensed under the "Numurus Software License", 
# which can be found at: <https://numurus.com/wp-content/uploads/Numurus-Software-License-Terms.pdf>
#
# Redistributions in source code must retain this top-level comment block.
# Plagiarizing this software to sidestep the license obligations is illegal.
#
# Contact Information:
# ====================
# - mailto:nepi@numurus.com
#
 */
import React from 'react';
import './ListBox.css';

const ListBox = ({ items = [], selectedItem, onSelect, readOnly }) => {
  //console.log('ListBox items:', items, 'Type:', typeof items, 'Selected:', selectedItem);
  return (
    <ul className="ListBox">
      {items.map((item) => (
        <li
          key={item}
          className={selectedItem === item ? 'selected' : ''}
          onClick={!readOnly ? (() => onSelect(item)) : undefined}
        >
          {item}
        </li>
      ))}
    </ul>
  );
};

export const IndexedListBox = ({ items = [], selectedItemIndex, onSelect, readOnly }) => {
  return (
    <ul className="ListBox">
      {items.map((item, index) => (
        <li
          key={item}
          className={selectedItemIndex === index ? 'selected' : ''}
          onClick={!readOnly ? (() => onSelect(item, index)) : undefined}
        >
          {item}
        </li>
      ))}
    </ul>
  )
}

export default ListBox;

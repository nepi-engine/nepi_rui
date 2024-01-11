/*
 * NEPI Dual-Use License
 * Project: nepi_rui
 *
 * This license applies to any user of NEPI Engine software
 *
 * Copyright (C) 2023 Numurus, LLC <https://www.numurus.com>
 * see https://github.com/numurus-nepi/nepi_rui
 *
 * This software is dual-licensed under the terms of either a NEPI software developer license
 * or a NEPI software commercial license.
 *
 * The terms of both the NEPI software developer and commercial licenses
 * can be found at: www.numurus.com/licensing-nepi-engine
 *
 * Redistributions in source code must retain this top-level comment block.
 * Plagiarizing this software to sidestep the license obligations is illegal.
 *
 * Contact Information:
 * ====================
 * - https://www.numurus.com/licensing-nepi-engine
 * - mailto:nepi@numurus.com
 *
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

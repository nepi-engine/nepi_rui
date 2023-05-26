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

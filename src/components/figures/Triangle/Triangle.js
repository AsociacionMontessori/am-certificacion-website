import React from 'react';
import PropTypes from 'prop-types';
import './Triangle.css';

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

const Triangle = ({ id, rotate, color, x, y, rand }) => {
  rand ? rand = getRandomInt(10) : rand = 0
  const triangleStyle = {
    transform: `rotate(${rotate * (getRandomInt(10) / 2)}deg)`,
    position: "relative",
    opacity: ".3",
    borderBottomColor: color,
    color: color,
    left: `${x + rand}vh`,
    bottom: `${y + rand}vh`,
  };

  return (
    <div id={id} className="gg-shape-triangle" style={triangleStyle}></div>
  );
};

Triangle.propTypes = {
  rotate: PropTypes.number,
  color: PropTypes.string
};

Triangle.defaultProps = {
  rotate: 0,
  color: 'black'
};

export default Triangle;




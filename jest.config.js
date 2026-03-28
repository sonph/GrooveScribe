export default {
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  moduleNameMapper: {
    // If we have CSS imports in JS later
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
};

module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
    '^react-dom/(.*)$': '<rootDir>/node_modules/react-dom/$1'
  },
  transform: {
    '^.+\\.jsx?$': ['babel-jest', { configFile: './.babelrc' }]
  },
  transformIgnorePatterns: ['/node_modules/'],
  setupFilesAfterSetup: ['<rootDir>/src/setupTests.js']
};

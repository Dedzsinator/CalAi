module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@utils': './src/utils',
            '@services': './src/services',
            '@store': './src/store',
            '@types': './src/types',
            '@assets': './assets',
          },
        },
      ],
      'react-native-reanimated/plugin', // This should be last
    ],
  };
};

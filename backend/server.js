import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { config } from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

config({ path: './.env' });
if (!process.env.NODE_ENV) {
  console.error('[Startup] Ошибка: NODE_ENV не определён. Проверьте файл .env');
  process.exit(1);
}
console.log('[Startup] Загрузка .env: Успешно, NODE_ENV:', process.env.NODE_ENV);

const apiCache = new Map();
apiCache.clear();
console.log('[Startup] Кэш API очищен');

const app = express();

app.use(cors({
  origin: process.env.HOST || 'http://localhost:5173',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url} from ${req.get('Origin') || 'unknown'}`);
  if (req.method === 'OPTIONS') {
    console.log('[CORS] Обработка OPTIONS запроса для', req.url);
    return res.status(200).end();
  }
  next();
});

app.use(express.json({ limit: '50mb' }));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tripai', {
  serverSelectionTimeoutMS: 5000,
})
  .then(() => console.log('[MongoDB] Подключено успешно'))
  .catch(err => {
    console.error('[MongoDB] Ошибка подключения:', err.message);
    process.exit(1);
  });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

const cityCoordinates = {
  'Боровое': { lat: 53.4167, lng: 70.3167, airport: 'KOV' },
  'Алматы': { lat: 43.2220, lng: 76.8512, airport: 'ALA' },
  'Астана': { lat: 51.1694, lng: 71.4491, airport: 'NQZ' },
  'Шымкент': { lat: 42.3000, lng: 69.6000, airport: 'CIT' },
  'Караганда': { lat: 49.8047, lng: 73.1094, airport: 'KGF' },
  'Актобе': { lat: 50.2839, lng: 57.1670, airport: 'AKX' },
  'Кокшетау': { lat: 53.2833, lng: 69.3833, airport: 'KOV' },
  'Тараз': { lat: 42.9000, lng: 71.3667, airport: 'DMB' },
  'Павлодар': { lat: 52.2833, lng: 76.9667, airport: 'PWQ' },
  'Усть-Каменогорск': { lat: 49.9667, lng: 82.6000, airport: 'UKK' },
  'Семей': { lat: 50.4167, lng: 80.2667, airport: 'PLX' },
  'Атырау': { lat: 47.1167, lng: 51.8833, airport: 'GUW' },
  'Катон-Карагай': { lat: 48.5, lng: 84.5, airport: 'UKK' }, // Примерные координаты
};

async function askOpenAI(prompt) {
  try {
    if (typeof prompt !== 'string') throw new Error('Prompt должен быть строкой');
    console.log('[OpenAI] Отправка запроса с prompt:', prompt.substring(0, 100) + '...');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        model: 'gpt-3.5-turbo', 
        messages: [{ role: 'user', content: prompt }], 
        temperature: 0.7 
      }),
      timeout: 15000,
    });
    console.log('[OpenAI] Ответ от API:', res.status, res.statusText);
    if (!res.ok) throw new Error(`OpenAI API вернул статус ${res.status}: ${await res.text()}`);
    const data = await res.json();
    console.log('[OpenAI] Полученные данные:', JSON.stringify(data, null, 2));
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('Пустой ответ от OpenAI');
    return content;
  } catch (err) {
    console.error('[OpenAI] Ошибка:', err.message, err.stack);
    return null;
  }
}

function generateRealisticTaxi(from, to, fromCoords, toCoords, isAirportToHotel = false) {
  const distanceKm = Math.round(Math.sqrt(Math.pow(toCoords.lat - fromCoords.lat, 2) + Math.pow(toCoords.lng - fromCoords.lng, 2)) * 111);
  const basePrice = isAirportToHotel ? 5000 : distanceKm * 50;
  return [
    { 
      id: `mock_${Date.now()}`, 
      company: 'Яндекс.Такси', 
      price: `${basePrice}-${basePrice + 5000} KZT`, 
      eta: '5-10 мин', 
      link: `yandextaxi://order?from=${encodeURIComponent(`${from}, ${fromCoords.lat},${fromCoords.lng}`)}&to=${encodeURIComponent(`${to}, ${toCoords.lat},${toCoords.lng}`)}`
    },
    { 
      id: `mock_${Date.now() + 1}`, 
      company: 'InDriver', 
      price: `${Math.round(basePrice * 0.9)}-${Math.round((basePrice + 5000) * 0.9)} KZT`, 
      eta: '7-12 мин', 
      link: `indriver://order?from=${encodeURIComponent(`${from}, ${fromCoords.lat},${fromCoords.lng}`)}&to=${encodeURIComponent(`${to}, ${toCoords.lat},${toCoords.lng}`)}`
    },
  ];
}

app.post('/api/translate', async (req, res) => {
  try {
    const { text, target_lang, source_lang } = req.body;
    if (!text || !target_lang) {
      return res.status(400).json({ error: 'Поля text и target_lang обязательны' });
    }

    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: Array.isArray(text) ? text : [text],
        target_lang,
        source_lang: source_lang || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepL API ошибка: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('[Translate API] Ошибка:', err.message);
    res.status(500).json({ error: 'Ошибка перевода', details: err.message });
  }
});

app.post('/api/ai', async (req, res) => {
  try {
    const { prompt, userCity = 'Астана' } = req.body;
    console.log('[AI API] Получен запрос:', { prompt, userCity });

    if (typeof prompt !== 'string' || !prompt.trim()) return res.status(400).json({ error: 'Prompt должен быть непустой строкой' });

    let location = 'Боровое';
    const locationMatch = prompt.match(/в\s+([А-Яа-яЁё\s-]+)\s*/i);
    if (locationMatch) location = locationMatch[1].trim().charAt(0).toUpperCase() + locationMatch[1].trim().slice(1).toLowerCase();

    let destCoords = cityCoordinates[location];
if (!destCoords) {
  const coordPrompt = `Определи координаты (latitude и longitude) для места "${location}" в Казахстане в формате JSON: {"latitude": число, "longitude": число}. Если место неизвестно, верни {"latitude": null, "longitude": null}. Убедись, что координаты находятся в пределах Казахстана (примерно 40-55 широты и 46-87 долготы).`;
  const coordResponse = await askOpenAI(coordPrompt);
  if (coordResponse) {
    try {
      const coords = JSON.parse(coordResponse);
      if (coords.latitude && coords.longitude && coords.latitude >= 40 && coords.latitude <= 55 && coords.longitude >= 46 && coords.longitude <= 87) {
        destCoords = { lat: coords.latitude, lng: coords.longitude };
      } else {
        console.warn('[AI API] Координаты вне пределов Казахстана, используем Боровое:', coords);
        destCoords = cityCoordinates['Боровое'];
      }
    } catch (e) {
      console.error('[AI API] Ошибка парсинга координат:', e.message, 'Response:', coordResponse);
      destCoords = cityCoordinates['Боровое'];
    }
  } else {
    console.warn('[AI API] Пустой ответ от OpenAI для координат');
    destCoords = cityCoordinates['Боровое'];
  }
}

    const needsFlight = userCity !== location;

    const enhancedPrompt = `${prompt}. Сгенерируй список из 2-3 туров в формате JSON (массив объектов). Каждый тур должен содержать: title (строка), description (строка, 2-3 предложения), location (строка, "${location}"), latitude (число, ${destCoords.lat}), longitude (число, ${destCoords.lng}), needsFlight (булево, ${needsFlight}). Верни только JSON массив.`;
    const response = await askOpenAI(enhancedPrompt);
    console.log('[AI API] OpenAI ответ:', response);
    if (!response) return res.status(500).json({ error: 'Ошибка OpenAI API', details: 'Пустой ответ' });

    let tours;
    try {
      tours = JSON.parse(response).filter(t => t.title && t.description && t.location === location && typeof t.latitude === 'number' && typeof t.longitude === 'number' && typeof t.needsFlight === 'boolean');
      tours = tours.map(tour => ({
        ...tour,
        needsFlight: tour.needsFlight !== undefined ? tour.needsFlight : needsFlight
      }));
      console.log('[AI API] Парсенные туры:', tours);
    } catch (e) {
      console.error('[AI API] Ошибка парсинга туров:', e.message, 'Response:', response);
      return res.status(500).json({ error: 'Ошибка парсинга ответа OpenAI', details: e.message });
    }
    if (tours.length === 0) return res.status(500).json({ error: 'Нет валидных туров' });

    res.json({ tours });
  } catch (error) {
    console.error('[AI API] Ошибка обработки запроса:', error.message, error.stack);
    res.status(500).json({ error: 'Ошибка сервера', details: error.message, stack: error.stack });
  }
});

app.post('/api/hotels', async (req, res) => {
  try {
    const { textQuery, latitude, longitude } = req.body;
    if (!textQuery || typeof textQuery !== 'string' || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'Поле textQuery должно быть строкой, latitude и longitude - числами' });
    }

    const cacheKey = `hotels_${textQuery}_${latitude}_${longitude}`;
    if (apiCache.has(cacheKey) && (Date.now() - apiCache.get(cacheKey).timestamp) < 24 * 3600000) {
      console.log('[Hotels API] Использован кэш для:', cacheKey);
      return res.json(apiCache.get(cacheKey).data);
    }

    console.log('[Hotels API] Запрос отелей:', { textQuery, latitude, longitude });
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GOOGLE_MAPS_API_KEY не настроен' });

    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating',
      },
      body: JSON.stringify({
        textQuery: `hotels near ${latitude},${longitude}`,
        languageCode: 'ru',
        maxResultCount: 10,
      }),
      timeout: 15000,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google Places API ошибка: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    if (!data.places || data.places.length === 0) {
      return res.json({ hotels: [] });
    }

    const hotels = await Promise.all(data.places.map(async (place) => {
      const pricePrompt = `Сгенерируй реалистичную цену за ночь для отеля "${place.displayName.text}" в районе ${latitude},${longitude} в Казахстане в формате "XXXXX KZT", где XXXXX — число от 15000 до 100000.`;
      const price = (await askOpenAI(pricePrompt)) || '35000 KZT';
      return {
        name: place.displayName.text,
        price: price.replace(/\D/g, '') > 100000 ? '35000 KZT' : price,
        rating: place.rating ? `${place.rating}/5` : 'N/A',
        hotel_id: place.id,
        link: `https://www.google.com/maps/place/?q=place_id:${place.id}`,
        address: place.formattedAddress || 'Адрес не указан',
        latitude: place.location.latitude,
        longitude: place.location.longitude,
      };
    }));

    console.log('[Hotels API] Найдено отелей:', hotels.length);
    apiCache.set(cacheKey, { data: hotels, timestamp: Date.now() });
    res.json(hotels);
  } catch (err) {
    console.error('[Hotels API] Ошибка:', err.message);
    res.status(500).json({ error: 'Ошибка сервера при поиске отелей', details: err.message, hotels: [] });
  }
});

app.post('/api/flights/init', async (req, res) => {
  try {
    const { prompt = '', userCity = 'Астана', departure_at = new Date().toISOString().split('T')[0], return_at } = req.body;
    console.log('[Flights API] Получен запрос:', { prompt, userCity, departure_at, return_at });

    if (typeof prompt !== 'string') {
      throw new Error('Prompt должен быть строкой');
    }

    const cityToAirportCode = {
      'Боровое': 'KOV', 'Алматы': 'ALA', 'Астана': 'NQZ', 'Шымкент': 'CIT',
      'Караганда': 'KGF', 'Актобе': 'AKX', 'Кокшетау': 'KOV', 'Тараз': 'CIT',
      'Павлодар': 'PWQ', 'Усть-Каменогорск': 'UKK', 'Семей': 'PLX', 'Атырау': 'GUW',
    };

    let destination = null;
    const cityNames = Object.keys(cityToAirportCode);
    for (const city of cityNames) {
      if (prompt.toLowerCase().includes(city.toLowerCase())) {
        destination = city;
        break;
      }
    }

    if (!destination) {
      const openaiPrompt = `Из запроса "${prompt || 'не указан'}" определи город назначения в Казахстане. Верни только название: Алматы, Астана, Боровое и т.д.`;
      const aiResponse = await askOpenAI(openaiPrompt);
      if (aiResponse && typeof aiResponse === 'string') {
        for (const city of cityNames) {
          if (aiResponse.toLowerCase().includes(city.toLowerCase())) {
            destination = city;
            break;
          }
        }
      }
    }

    if (!destination) destination = 'Алматы';

    const originCode = cityToAirportCode[userCity] || 'NQZ';
    const destinationCode = cityToAirportCode[destination] || 'ALA';

    if (originCode === destinationCode) {
      console.log('[Flights API] Города совпадают, рейсы не нужны');
      return res.json({ flights: [], needsFlight: false });
    }

    const token = process.env.TRAVELPAYOUTS_TOKEN;
    if (!token) throw new Error('TRAVELPAYOUTS_TOKEN не настроен');

    const url = new URL('https://api.travelpayouts.com/aviasales/v3/prices_for_dates');
    url.searchParams.append('origin', originCode);
    url.searchParams.append('destination', destinationCode);
    url.searchParams.append('departure_at', departure_at.slice(0, 7)); // YYYY-MM
    if (return_at) url.searchParams.append('return_at', return_at.slice(0, 7));
    url.searchParams.append('currency', 'kzt');
    url.searchParams.append('token', token);
    url.searchParams.append('limit', '10');
    url.searchParams.append('one_way', 'true');
    url.searchParams.append('sorting', 'price');
    url.searchParams.append('market', 'kz');

    const cacheKey = `flights_${originCode}_${destinationCode}_${departure_at.slice(0, 7)}`;
    if (apiCache.has(cacheKey) && (Date.now() - apiCache.get(cacheKey).timestamp) < 24 * 3600000) {
      console.log('[Flights API] Использован кэш');
      return res.json(apiCache.get(cacheKey).data);
    }

    console.log('[Flights API] Запрос к:', url.toString());
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      timeout: 15000,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Flights API] Ошибка от Aviasales:', errorText);
      throw new Error(`Aviasales API ошибка: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[Flights API] Ответ от Aviasales:', JSON.stringify(data, null, 2));

    if (!data.success || !data.data || data.data.length === 0) {
      return res.json({ flights: [], needsFlight: true });
    }

    const flights = data.data.map(flight => ({
      origin: flight.origin,
      destination: flight.destination,
      price: flight.value ? `${flight.value} KZT` : 'Цена по запросу',
      date: flight.depart_date,
      airline: flight.airline || 'KC',
      link: flight.link ? `https://www.aviasales.kz${flight.link}&marker=666287` : `https://www.aviasales.kz/search/${originCode}${destinationCode}${departure_at.replace(/-/g, '')}1&marker=666287`,
      flight_number: `${flight.airline || 'KC'}${Math.floor(Math.random() * 1000)}`,
      stops: flight.number_of_changes || 0,
      via: flight.number_of_changes > 0 ? 'через пересадки' : 'прямой рейс',
    }));

    const result = { flights, needsFlight: true };
    apiCache.set(cacheKey, { data: result, timestamp: Date.now() });
    res.json(result);
  } catch (error) {
    console.error('[Flights API] Ошибка:', error.message, error.stack);
    res.status(500).json({
      error: 'Ошибка поиска рейсов',
      details: error.message,
      flights: [],
      needsFlight: true
    });
  }
});


app.get('/api/taxi', async (req, res) => {
  try {
    const { from = 'Астана', to = 'Боровое', needsFlight = 'false', airportCode } = req.query;
    const isAirportToHotel = needsFlight === 'true' && airportCode;
    const fromCoords = isAirportToHotel ? cityCoordinates[to] || cityCoordinates['Боровое'] : cityCoordinates[from] || cityCoordinates['Астана'];
    const toCoords = cityCoordinates[to] || cityCoordinates['Боровое'];

    if (!fromCoords || !toCoords) return res.status(400).json({ error: `Координаты для ${!fromCoords ? from : to} не найдены` });

    const cacheKey = `taxi_${from}_${to}_${isAirportToHotel ? airportCode : ''}`;
    if (apiCache.has(cacheKey) && (Date.now() - apiCache.get(cacheKey).timestamp) < 24 * 3600000) {
      console.log('[Taxi API] Использован кэш для:', cacheKey);
      return res.json(apiCache.get(cacheKey).data);
    }

    const taxiOptions = generateRealisticTaxi(isAirportToHotel ? `${to} Airport` : from, to, fromCoords, toCoords, isAirportToHotel);
    apiCache.set(cacheKey, { data: taxiOptions, timestamp: Date.now() });
    res.json(taxiOptions);
  } catch (err) {
    console.error('[Taxi API] Ошибка:', err.message);
    res.status(500).json({ error: 'Ошибка сервера при поиске такси', details: err.message, taxi: generateRealisticTaxi(req.query.from || 'Астана', req.query.to || 'Боровое', cityCoordinates['Астана'], cityCoordinates['Боровое']) });
  }
});

app.post('/api/consultation', async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone || !/^\+?\d{10,12}$/.test(phone)) return res.status(400).json({ error: 'Не указано имя или телефон в формате (10-12 цифр, опционально с +)' });
    res.json({ success: true, message: 'Заявка принята, скоро с вами свяжутся' });
  } catch (err) {
    console.error('[Consultation API] Ошибка:', err.message);
    res.status(500).json({ error: 'Ошибка отправки заявки', details: err.message });
  }
});

app.post('/api/tourguide', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    console.log('[TourGuide API] Получен запрос:', JSON.stringify(req.body, null, 2));

    if (!prompt || typeof prompt !== 'string' || !context || typeof context !== 'object') {
      return res.status(400).json({ error: 'Поле prompt (строка) и context (объект) обязательны', received: req.body });
    }

    const fullPrompt = `
      Вы виртуальный тургид. Отвечайте на вопросы на русском языке, учитывая следующий контекст:
      - Местоположение: ${context.location || 'не указано'}
      - Описание: ${context.description || 'не указано'}
      - Координаты: ${context.latitude || 'не указано'}, ${context.longitude || 'не указано'}
      Вопрос: ${prompt}
    `;

    const response = await askOpenAI(fullPrompt);
    if (!response) {
      return res.status(500).json({ error: 'Ошибка получения ответа от OpenAI', details: 'Пустой ответ' });
    }

    res.json({ response });
  } catch (error) {
    console.error('[TourGuide API] Ошибка:', error.message, error.stack);
    res.status(500).json({ error: 'Ошибка сервера', details: error.message });
  }
});


app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6) return res.status(400).json({ error: 'Заполните все поля: имя, email и пароль (минимум 6 символов)' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email уже зарегистрирован' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '7d' });
    res.status(201).json({ success: true, user: { name, email, token }, message: 'Регистрация успешна' });
  } catch (err) {
    console.error('[Register API] Ошибка:', err.message);
    res.status(500).json({ error: 'Ошибка регистрации', details: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Заполните email и пароль' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Пользователь не найден' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Неверный пароль' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '7d' });
    res.json({ success: true, user: { name: user.name, email, token }, message: 'Вход успешен' });
  } catch (err) {
    console.error('[Login API] Ошибка:', err.message);
    res.status(500).json({ error: 'Ошибка входа', details: err.message });
  }
});

app.use((req, res) => {
  console.warn(`[404] Маршрут не найден: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Маршрут не найден' });
});

app.use((err, req, res, next) => {
  console.error('[Error Handler]', err.stack);
  res.status(500).json({ error: 'Внутренняя ошибка сервера', details: err.message });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
  console.log('🔗 Доступные маршруты:');
  console.log('  POST /api/ai - Генерация туров');
  console.log('  POST /api/hotels - Поиск отелей');
  console.log('  POST /api/flights/init - Поиск рейсов (Aviasales)');
  console.log('  GET /api/taxi - Поиск такси');
  console.log('  POST /api/consultation - Заявка');
  console.log('  POST /api/register - Регистрация');
  console.log('  POST /api/login - Вход');
});
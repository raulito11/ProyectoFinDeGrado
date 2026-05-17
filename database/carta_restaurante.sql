-- ============================================================
-- Carta del Restaurante Los Olivos
-- Ejecutar en phpMyAdmin sobre la base de datos restaurante_tfg
-- ============================================================

-- Limpia platos existentes antes de insertar (evita duplicados)
DELETE FROM platos;

-- ============================================================
-- INSERT ÚNICO — 36 platos
--
-- id_categoria:
--   7=Entrantes | 8=Arroces | 9=Pescados
--  10=Carnes   | 11=Postres | 12=Bebidas
--
-- destacado: 0=normal | activo: 1=visible, 0=oculto
-- ============================================================

INSERT INTO platos (id_categoria, nombre, descripcion, precio, imagen, destacado, activo) VALUES

-- Entrantes
(7,  'Pan con tomate y aceite de oliva virgen extra', 'Pan de masa madre tostado con tomate rallado y AOVE',                    4.50,  NULL, 0, 1),
(7,  'Tabla de ibéricos',                             'Selección de jamón ibérico, lomo y chorizo con pan',                    14.90, NULL, 0, 1),
(7,  'Croquetas de bacalao (6 uds.)',                 'Croquetas caseras de bacalao con bechamel y rebozado crujiente',         8.50,  NULL, 0, 1),
(7,  'Gambas al ajillo',                              'Gambas salteadas en aceite de oliva con ajo y guindilla',               10.90, NULL, 0, 1),
(7,  'Pulpo a la gallega con pimentón',               'Pulpo cocido con pimentón de la Vera, sal gruesa y AOVE',              13.50, NULL, 0, 1),
(7,  'Boquerones en vinagre',                         'Boquerones marinados en vinagre con ajo y perejil',                     7.90,  NULL, 0, 1),
(7,  'Ensalada griega',                               'Tomate, pepino, cebolla roja, olivas kalamata y queso feta',            9.50,  NULL, 0, 1),
(7,  'Hummus con pita tostada',                       'Crema de garbanzos con tahini, limón y pimentón ahumado',               6.90,  NULL, 0, 1),

-- Arroces
(8,  'Paella valenciana',                             'Paella tradicional con pollo, conejo, judía verde y garrofón',         16.90, NULL, 0, 1),
(8,  'Arroz negro con alioli',                        'Arroz negro con sepia y calamares, servido con alioli casero',         17.50, NULL, 0, 1),
(8,  'Arroz caldoso de bogavante',                    'Arroz meloso con bogavante fresco y sofrito de tomate',                24.90, NULL, 0, 1),
(8,  'Fideuà de marisco',                             'Fideos finos con gambas, mejillones y almejas',                        18.50, NULL, 0, 1),

-- Pescados
(9,  'Lubina a la sal',                               'Lubina entera horneada en costra de sal con guarnición',              19.90, NULL, 0, 1),
(9,  'Dorada a la brasa con limón',                   'Dorada fresca a la brasa con limón, ajo y hierbas mediterráneas',     18.50, NULL, 0, 1),
(9,  'Bacalao al pil-pil',                            'Bacalao desalado confitado en AOVE con salsa pil-pil tradicional',    17.90, NULL, 0, 1),
(9,  'Merluza en salsa verde',                        'Merluza con almejas en salsa verde de perejil y vino blanco',         16.90, NULL, 0, 1),
(9,  'Calamar a la plancha',                          'Calamar fresco a la plancha con limón y sal maldon',                  14.50, NULL, 0, 1),

-- Carnes
(10, 'Secreto ibérico a la brasa',                    'Secreto de cerdo ibérico a la brasa con patatas panadera',            17.90, NULL, 0, 1),
(10, 'Pollo al limón con hierbas mediterráneas',      'Muslos de pollo al horno con romero, tomillo y limón',                13.90, NULL, 0, 1),
(10, 'Chuletillas de cordero',                        'Chuletillas de cordero lechal a la brasa con chimichurri',            19.50, NULL, 0, 1),
(10, 'Entrecot de ternera con salsa de vino tinto',   'Entrecot de 300g con reducción de vino tinto y patatas fritas',      22.90, NULL, 0, 1),

-- Postres
(11, 'Crema catalana',                                'Crema pastelera con costra de azúcar caramelizado',                    5.90, NULL, 0, 1),
(11, 'Tarta de queso al horno',                       'Tarta de queso cremosa al estilo vasco con mermelada de frutos rojos', 6.50, NULL, 0, 1),
(11, 'Brownie con helado de vainilla',                'Brownie de chocolate negro con nueces y bola de helado de vainilla',   6.90, NULL, 0, 1),
(11, 'Panna cotta con frutos rojos',                  'Panna cotta italiana con coulis de frutos rojos del bosque',           5.90, NULL, 0, 0),
(11, 'Sorbete de limón',                              'Sorbete artesanal de limón con hierbabuena',                           4.50, NULL, 0, 1),

-- Bebidas
(12, 'Agua mineral (50 cl)',                          'Agua mineral natural o con gas',                                       2.00, NULL, 0, 1),
(12, 'Refresco (lata)',                               'Coca-Cola, Fanta naranja, Fanta limón o Nestea',                       2.50, NULL, 0, 1),
(12, 'Cerveza artesanal',                             'Cerveza artesanal de producción local (33 cl)',                        3.50, NULL, 0, 1),
(12, 'Vino blanco de la casa (copa)',                 'Vino blanco de la región, fresco y afrutado',                          3.50, NULL, 0, 1),
(12, 'Vino rosado de la casa (copa)',                 'Vino rosado de la región, ligero y aromático',                         3.50, NULL, 0, 1),
(12, 'Vino tinto de la casa (copa)',                  'Vino tinto crianza de la región',                                      3.50, NULL, 0, 1),
(12, 'Sangría (jarra 1L)',                            'Sangría casera con vino tinto, frutas de temporada y brandy',         12.90, NULL, 0, 1),
(12, 'Café solo',                                     'Café espresso',                                                        1.80, NULL, 0, 1),
(12, 'Café cortado',                                  'Café espresso con un chorrito de leche',                               1.80, NULL, 0, 1),
(12, 'Café con leche',                                'Café espresso con leche caliente al 50%',                              2.20, NULL, 0, 1);

-- ============================================================
-- FIN DEL SCRIPT — 36 platos
-- ============================================================

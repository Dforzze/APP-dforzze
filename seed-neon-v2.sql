-- ============================================================
-- SEED COMPLETO v2 - Dforzze → Neon PostgreSQL
-- Incluye: tablas nuevas + datos + columna theme
-- Pegá TODO en: neon.tech → SQL Editor → Run
-- ============================================================

-- ── STEP 1: CREAR TABLAS NUEVAS ─────────────────────────────

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "theme" TEXT NOT NULL DEFAULT 'dark';

CREATE TABLE IF NOT EXISTS "Proveedor" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "contacto" TEXT NOT NULL DEFAULT '',
  "telefono" TEXT NOT NULL DEFAULT '',
  "categoria" TEXT NOT NULL DEFAULT 'Otros',
  "notas" TEXT NOT NULL DEFAULT '',
  "businessId" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Compra" (
  "id" TEXT PRIMARY KEY,
  "proveedorId" TEXT NOT NULL,
  "desc" TEXT NOT NULL,
  "monto" DOUBLE PRECISION NOT NULL,
  "fecha" TEXT NOT NULL,
  "estado" TEXT NOT NULL DEFAULT 'pagado',
  "businessId" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE CASCADE,
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Nota" (
  "id" TEXT PRIMARY KEY,
  "titulo" TEXT NOT NULL DEFAULT '',
  "contenido" TEXT NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#8b5cf6',
  "businessId" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Meta" (
  "id" TEXT PRIMARY KEY,
  "nombre" TEXT NOT NULL,
  "tipo" TEXT NOT NULL DEFAULT 'ventas',
  "objetivo" DOUBLE PRECISION NOT NULL,
  "periodo" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE
);

-- ── STEP 2: INSERTAR DATOS ───────────────────────────────────

-- NEGOCIO
INSERT INTO "Business" (id, name, slug, plan, "cajaManual", "createdAt", "updatedAt")
VALUES ('cmqb80war0018q6bvjmnll1np', 'Dforzze', 'dforzze', 'free', 0, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- USUARIO (email: dforzzestudio@gmail.com / contra: netoforzze321$)
INSERT INTO "User" (id, email, name, password, role, "businessId", theme, "createdAt", "updatedAt")
VALUES ('usr_dforzze_owner', 'dforzzestudio@gmail.com', 'Dforzze Admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHuu', 'owner', 'cmqb80war0018q6bvjmnll1np', 'light', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- DROP
INSERT INTO "Drop" (id, name, "desc", date, status, "businessId", "createdAt")
VALUES ('cmqb82fgg001cq6bvogbc21sq', 'COLECCION#2', '', '2026-05-01', 'activo', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.056Z')
ON CONFLICT (id) DO NOTHING;

-- PRODUCTOS
INSERT INTO "Producto" (id, name, "dropId", color, talla, stock, precio, "precioMayor", costo, "minStock", "businessId", "createdAt") VALUES
('cmqb82fhp002sq6bvshhu9epm', 'POLERA', 'cmqb82fgg001cq6bvogbc21sq', 'ROJO', 'M', 0, 90, 70, 54, 2, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.101Z'),
('cmqb82fhq002uq6bvgbq5zdme', 'POLERA', 'cmqb82fgg001cq6bvogbc21sq', 'ROJO', 'L', 0, 90, 70, 54, 2, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.102Z'),
('cmqb82fhr002wq6bvk0j372a1', 'POLERA', 'cmqb82fgg001cq6bvogbc21sq', 'ROSA', 'M', 0, 90, 70, 54, 2, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.103Z'),
('cmqb82fhs002yq6bvjlzrq625', 'POLERA', 'cmqb82fgg001cq6bvogbc21sq', 'ROSA', 'L', 0, 90, 70, 54, 2, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.104Z'),
('cmqb82fht0030q6bvcl8wdyef', 'POLERA', 'cmqb82fgg001cq6bvogbc21sq', 'NARANJA', 'M', 0, 90, 70, 54, 2, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.105Z'),
('cmqb82fhu0032q6bvpr3j5qfd', 'POLERA', 'cmqb82fgg001cq6bvogbc21sq', 'NARANJA', 'L', 1, 90, 70, 54, 2, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.106Z')
ON CONFLICT (id) DO NOTHING;

-- CLIENTES
INSERT INTO "Cliente" (id, name, phone, notes, "businessId", "createdAt") VALUES
('cmqb82fgi001eq6bvl265k41a', 'DANIEL', '981354349', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.059Z'),
('cmqb82fgk001gq6bvdxhe3276', 'FABIAN', '930802194', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.061Z'),
('cmqb82fgm001iq6bvoxf7u0wd', 'ALESKA', '978693355', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.062Z'),
('cmqb82fgo001kq6bvwaud1hlt', 'DUKI', '934 738 679', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.064Z'),
('cmqb82fgp001mq6bvd0sofhh0', 'SALSEDO DOMINGUEZ', '', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.066Z'),
('cmqb82fgr001oq6bvb7uymsmg', 'ANGEL ARON', '912628937', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.067Z'),
('cmqb82fgs001qq6bvdt8xtuj3', 'ABDAIR', '', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.068Z'),
('cmqb82fgx001sq6bvboaoauw6', 'MATIAS MORILLO', '', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.074Z'),
('cmqb82fgz001uq6bvlyis2ro8', 'ESTEFANO', '', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.075Z'),
('cmqb82fh1001wq6bvebrmfdy0', 'FABRICIO', '962940312', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.077Z'),
('cmqb82fh2001yq6bv66c9w31w', 'SEBASTIAN', '924602079', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.079Z'),
('cmqb82fh40020q6bvvr5kt2us', 'LAMS', '932075471', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.080Z'),
('cmqb82fh50022q6bviygqodoa', 'ANTONELLA', '967823012', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.082Z'),
('cmqb82fh70024q6bvkfbebe1m', 'BERTHA BEATRIZ', '918190277', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.083Z'),
('cmqb82fh90026q6bvqwdrx58r', 'Toshiro', '932634385', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.085Z'),
('cmqb82fha0028q6bvnl6tykb1', 'Evelin JIMez', '941341083', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.086Z'),
('cmqb82fhb002aq6bv6qxkppbh', 'JHONEL CESPED', '921482403', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.088Z'),
('cmqb82fhd002cq6bvbfuct7jx', 'AMGELO TULLUNAME', '912628937', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.089Z'),
('cmqb82fhe002eq6bvyv2ppj4y', 'gonzalo gonzales', '987246252', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.091Z'),
('cmqb82fhg002gq6bvhemkof0q', 'valeria', '920829088', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.093Z'),
('cmqb82fhi002iq6bvg0xuzrms', 'gonzaloortiz', '', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.094Z'),
('cmqb82fhj002kq6bv02imlj8i', 'abel', '946029060', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.096Z'),
('cmqb82fhl002mq6bvw2v2l4pj', 'Rodrigo cruz', '', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.097Z'),
('cmqb82fhm002oq6bvoryl7mw1', 'LUIGI', '', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.099Z'),
('cmqb82fho002qq6bvbfmt24pb', 'ALBEYRO GONZALES', '', '', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.100Z')
ON CONFLICT (id) DO NOTHING;

-- VENTAS
INSERT INTO "Venta" (id, cliente, vendedor, fecha, "dropId", "metodoPago", nota, total, "comisionPct", "comisionMonto", "businessId", "createdAt") VALUES
('cmqb82flx007mq6bvv6fewmun', 'DANIEL', '', '2026-05-22', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', '', 95, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.254Z'),
('cmqb82flu007gq6bvi5bhgxiq', 'FABIAN', '', '2026-05-22', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', '', 95, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.250Z'),
('cmqb82flq007aq6bve22lvw33', 'ALESKA', '', '2026-05-22', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', '', 95, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.246Z'),
('cmqb82flm0074q6bv2isohcpi', 'ANGEL ARON', '', '2026-05-23', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', '', 90, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.243Z'),
('cmqb82flj006yq6bvh3j7oxwb', 'ANGEL ARON', '', '2026-05-23', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', '', 90, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.239Z'),
('cmqb82flf006sq6bv6cb39w64', 'ABDAIR', '', '2026-05-23', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', '', 95, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.235Z'),
('cmqb82flb006mq6bvtoo6o6qx', 'MATIAS MORILLO', '', '2026-05-28', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', '', 90, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.232Z'),
('cmqb82fl8006gq6bv3xftndl0', 'ESTEFANO', '', '2026-05-28', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', '', 90, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.228Z'),
('cmqb82fl5006aq6bvfcvrvth5', 'FABRICIO', '', '2026-05-28', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', '', 100, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.225Z'),
('cmqb82fl10064q6bv22kougde', 'DUKI', '', '2026-05-28', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', '', 90, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.222Z'),
('cmqb82fky005yq6bvmn9vwdr1', 'DUKI', '', '2026-05-28', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', '', 90, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.218Z'),
('cmqb82fku005sq6bv1bly80dh', 'DUKI', '', '2026-05-28', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', '', 90, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.214Z'),
('cmqb82fkq005mq6bv0ioa9pan', 'SEBASTIAN', '', '2026-05-28', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', '', 95, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.210Z'),
('cmqb82fkk005gq6bvg9p695wt', 'LAMS', '', '2026-05-29', 'cmqb82fgg001cq6bvogbc21sq', 'Efectivo', '', 90, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.205Z'),
('cmqb82fke005aq6bvkzc2o3vy', 'ANTONELLA', '', '2026-05-29', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', '', 90, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.199Z'),
('cmqb82fjw0054q6bvc6mvua9e', 'BERTHA BEATRIZ', '', '2026-05-29', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', '', 90, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.180Z'),
('cmqb82fjr004yq6bvdrit421f', 'Toshiro', '932634385', '2026-05-30', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', '', 90, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.176Z'),
('cmqb82fjn004sq6bv4eswzw8y', 'Evelin JIMez', '', '2026-05-30', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', '', 90, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.171Z'),
('cmqb82fji004mq6bvhle0d7ql', 'AMGELO TULLUNAME', '', '2026-05-31', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', '', 90, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.167Z'),
('cmqb82fje004gq6bvbl26t1yc', 'JHONEL CESPED', '', '2026-06-02', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', '', 90, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.163Z'),
('cmqb82fja004aq6bvd4lk8t1u', 'JHONEL CESPED', '', '2026-06-02', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', '', 90, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.159Z'),
('cmqb82fj60044q6bvianym44f', 'valeria', '', '2026-06-02', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', '', 90, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.154Z'),
('cmqb82fiz003yq6bv2lar505q', 'gonzaloortiz', '', '2026-06-02', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', 'contraaentrega', 90, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.147Z'),
('cmqb82fid003sq6bvvoprvlt7', 'abel', '', '2026-06-03', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', '', 90, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.126Z'),
('cmqb82fi9003mq6bvsccor86g', 'LAMS', '', '2026-06-04', 'cmqb82fgg001cq6bvogbc21sq', 'Efectivo', '', 90, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.121Z'),
('cmqb82fi4003gq6bvvo1f64nz', 'Rodrigo cruz', '', '2026-06-10', 'cmqb82fgg001cq6bvogbc21sq', 'Transferencia', '', 90, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.117Z'),
('cmqb82fi0003aq6bvj8ueqy7c', 'LUIGI', '', '2026-06-10', 'cmqb82fgg001cq6bvogbc21sq', 'Yape', '', 90, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.113Z'),
('cmqb82fhv0034q6bvulbi7xe4', 'ALBEYRO GONZALES', '', '2026-06-10', 'cmqb82fgg001cq6bvogbc21sq', 'Efectivo', '', 90, 0, 0, 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.108Z')
ON CONFLICT (id) DO NOTHING;

-- VENTA ITEMS
INSERT INTO "VentaItem" (id, "ventaId", "productoId", "productName", color, talla, qty, precio, subtotal) VALUES
('cmqb82fly007oq6bvj1ngzoin', 'cmqb82flx007mq6bvv6fewmun', 'cmqb82fhp002sq6bvshhu9epm', 'POLERA', 'ROJO', 'M', 1, 95, 95),
('cmqb82flv007iq6bvn1ke3n9t', 'cmqb82flu007gq6bvi5bhgxiq', 'cmqb82fhs002yq6bvjlzrq625', 'POLERA', 'ROSA', 'L', 1, 95, 95),
('cmqb82flr007cq6bvk1piwax0', 'cmqb82flq007aq6bve22lvw33', 'cmqb82fhr002wq6bvk0j372a1', 'POLERA', 'ROSA', 'M', 1, 95, 95),
('cmqb82fln0076q6bv0qoo8ldk', 'cmqb82flm0074q6bv2isohcpi', 'cmqb82fhp002sq6bvshhu9epm', 'POLERA', 'ROJO', 'M', 1, 90, 90),
('cmqb82flk0070q6bvpxngc4ge', 'cmqb82flj006yq6bvh3j7oxwb', 'cmqb82fht0030q6bvcl8wdyef', 'POLERA', 'NARANJA', 'M', 1, 90, 90),
('cmqb82flg006uq6bvm40a4p8n', 'cmqb82flf006sq6bv6cb39w64', 'cmqb82fhr002wq6bvk0j372a1', 'POLERA', 'ROSA', 'M', 1, 95, 95),
('cmqb82flc006oq6bvio2mmswi', 'cmqb82flb006mq6bvtoo6o6qx', 'cmqb82fht0030q6bvcl8wdyef', 'POLERA', 'NARANJA', 'M', 1, 90, 90),
('cmqb82fl9006iq6bvppruensh', 'cmqb82fl8006gq6bv3xftndl0', 'cmqb82fht0030q6bvcl8wdyef', 'POLERA', 'NARANJA', 'M', 1, 90, 90),
('cmqb82fl5006cq6bv12uqfvzs', 'cmqb82fl5006aq6bvfcvrvth5', 'cmqb82fhu0032q6bvpr3j5qfd', 'POLERA', 'NARANJA', 'L', 1, 100, 100),
('cmqb82fl20066q6bv26feomih', 'cmqb82fl10064q6bv22kougde', 'cmqb82fhu0032q6bvpr3j5qfd', 'POLERA', 'NARANJA', 'L', 1, 90, 90),
('cmqb82fky0060q6bvpny0niyh', 'cmqb82fky005yq6bvmn9vwdr1', 'cmqb82fht0030q6bvcl8wdyef', 'POLERA', 'NARANJA', 'M', 1, 90, 90),
('cmqb82fkv005uq6bv1gtycx0q', 'cmqb82fku005sq6bv1bly80dh', 'cmqb82fhs002yq6bvjlzrq625', 'POLERA', 'ROSA', 'L', 1, 90, 90),
('cmqb82fkr005oq6bvzl0lrj0f', 'cmqb82fkq005mq6bv0ioa9pan', 'cmqb82fht0030q6bvcl8wdyef', 'POLERA', 'NARANJA', 'M', 1, 95, 95),
('cmqb82fkl005iq6bvtfqrbqek', 'cmqb82fkk005gq6bvg9p695wt', 'cmqb82fhr002wq6bvk0j372a1', 'POLERA', 'ROSA', 'M', 1, 90, 90),
('cmqb82fkg005cq6bv4x0ec6s2', 'cmqb82fke005aq6bvkzc2o3vy', 'cmqb82fhr002wq6bvk0j372a1', 'POLERA', 'ROSA', 'M', 1, 90, 90),
('cmqb82fjx0056q6bvrekrorjj', 'cmqb82fjw0054q6bvc6mvua9e', 'cmqb82fhu0032q6bvpr3j5qfd', 'POLERA', 'NARANJA', 'L', 1, 90, 90),
('cmqb82fjs0050q6bvo78zta6a', 'cmqb82fjr004yq6bvdrit421f', 'cmqb82fht0030q6bvcl8wdyef', 'POLERA', 'NARANJA', 'M', 1, 90, 90),
('cmqb82fjn004uq6bvkvkybri1', 'cmqb82fjn004sq6bv4eswzw8y', 'cmqb82fhp002sq6bvshhu9epm', 'POLERA', 'ROJO', 'M', 1, 90, 90),
('cmqb82fjj004oq6bvi8ui4v2u', 'cmqb82fji004mq6bvhle0d7ql', 'cmqb82fhr002wq6bvk0j372a1', 'POLERA', 'ROSA', 'M', 1, 90, 90),
('cmqb82fjf004iq6bv3z4wku4i', 'cmqb82fje004gq6bvbl26t1yc', 'cmqb82fhq002uq6bvgbq5zdme', 'POLERA', 'ROJO', 'L', 1, 90, 90),
('cmqb82fjb004cq6bviliyzg5m', 'cmqb82fja004aq6bvd4lk8t1u', 'cmqb82fhs002yq6bvjlzrq625', 'POLERA', 'ROSA', 'L', 1, 90, 90),
('cmqb82fj70046q6bvaho0i4oo', 'cmqb82fj60044q6bvianym44f', 'cmqb82fhs002yq6bvjlzrq625', 'POLERA', 'ROSA', 'L', 1, 90, 90),
('cmqb82fj20040q6bvzu9xiwwk', 'cmqb82fiz003yq6bv2lar505q', 'cmqb82fhs002yq6bvjlzrq625', 'POLERA', 'ROSA', 'L', 1, 90, 90),
('cmqb82fie003uq6bviqjq2qn4', 'cmqb82fid003sq6bvvoprvlt7', 'cmqb82fhq002uq6bvgbq5zdme', 'POLERA', 'ROJO', 'L', 1, 90, 90),
('cmqb82fia003oq6bv92pjsq3s', 'cmqb82fi9003mq6bvsccor86g', 'cmqb82fhp002sq6bvshhu9epm', 'POLERA', 'ROJO', 'M', 1, 90, 90),
('cmqb82fi5003iq6bvvxuf1mf7', 'cmqb82fi4003gq6bvvo1f64nz', 'cmqb82fhp002sq6bvshhu9epm', 'POLERA', 'ROJO', 'M', 1, 90, 90),
('cmqb82fi1003cq6bvgnylld2g', 'cmqb82fi0003aq6bvj8ueqy7c', 'cmqb82fhq002uq6bvgbq5zdme', 'POLERA', 'ROJO', 'L', 1, 90, 90),
('cmqb82fhw0036q6bvwv6p00kj', 'cmqb82fhv0034q6bvulbi7xe4', 'cmqb82fhq002uq6bvgbq5zdme', 'POLERA', 'ROJO', 'L', 1, 90, 90)
ON CONFLICT (id) DO NOTHING;

-- PEDIDOS
INSERT INTO "Pedido" (id, "ventaId", status, "businessId", "createdAt", "updatedAt") VALUES
('cmqb82flz007qq6bvv8bgzb1u', 'cmqb82flx007mq6bvv6fewmun', 'pendiente', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.256Z', '2026-06-12T17:50:29.256Z'),
('cmqb82flw007kq6bvwc04xhbc', 'cmqb82flu007gq6bvi5bhgxiq', 'pendiente', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.252Z', '2026-06-12T17:50:29.252Z'),
('cmqb82fls007eq6bvbdgme8pu', 'cmqb82flq007aq6bve22lvw33', 'entregado', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.249Z', '2026-06-12T19:30:20.526Z'),
('cmqb82flp0078q6bvvevu2lm0', 'cmqb82flm0074q6bv2isohcpi', 'confirmado', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.245Z', '2026-06-12T17:50:29.245Z'),
('cmqb82fll0072q6bvd2yojdgw', 'cmqb82flj006yq6bvh3j7oxwb', 'confirmado', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.242Z', '2026-06-12T17:50:29.242Z'),
('cmqb82fli006wq6bveuh0term', 'cmqb82flf006sq6bv6cb39w64', 'pendiente', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.238Z', '2026-06-12T17:50:29.238Z'),
('cmqb82fle006qq6bvu6um86d4', 'cmqb82flb006mq6bvtoo6o6qx', 'confirmado', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.234Z', '2026-06-12T17:50:29.234Z'),
('cmqb82fla006kq6bvshewhyil', 'cmqb82fl8006gq6bv3xftndl0', 'confirmado', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.231Z', '2026-06-12T17:50:29.231Z'),
('cmqb82fl7006eq6bvqf7yz2jw', 'cmqb82fl5006aq6bvfcvrvth5', 'confirmado', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.227Z', '2026-06-12T17:50:29.227Z'),
('cmqb82fl30068q6bvbzk8qovs', 'cmqb82fl10064q6bv22kougde', 'pendiente', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.224Z', '2026-06-12T17:50:29.224Z'),
('cmqb82fl00062q6bvo3ln4i01', 'cmqb82fky005yq6bvmn9vwdr1', 'pendiente', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.220Z', '2026-06-12T17:50:29.220Z'),
('cmqb82fkw005wq6bvyvwzmfag', 'cmqb82fku005sq6bv1bly80dh', 'pendiente', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.217Z', '2026-06-12T17:50:29.217Z'),
('cmqb82fkt005qq6bve883tzcc', 'cmqb82fkq005mq6bv0ioa9pan', 'confirmado', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.213Z', '2026-06-12T17:50:29.213Z'),
('cmqb82fko005kq6bvwxiw77ut', 'cmqb82fkk005gq6bvg9p695wt', 'confirmado', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.208Z', '2026-06-12T17:50:29.208Z'),
('cmqb82fki005eq6bvjjl2nor3', 'cmqb82fke005aq6bvkzc2o3vy', 'confirmado', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.202Z', '2026-06-12T17:50:29.202Z'),
('cmqb82fjz0058q6bv3mef3qsr', 'cmqb82fjw0054q6bvc6mvua9e', 'confirmado', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.183Z', '2026-06-12T17:50:29.183Z'),
('cmqb82fju0052q6bvij0irrwc', 'cmqb82fjr004yq6bvdrit421f', 'confirmado', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.178Z', '2026-06-12T17:50:29.178Z'),
('cmqb82fjp004wq6bvxc0i980h', 'cmqb82fjn004sq6bv4eswzw8y', 'confirmado', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.174Z', '2026-06-12T17:50:29.174Z'),
('cmqb82fjl004qq6bv7gq5p147', 'cmqb82fji004mq6bvhle0d7ql', 'confirmado', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.169Z', '2026-06-12T17:50:29.169Z'),
('cmqb82fjh004kq6bv6q6yuigw', 'cmqb82fje004gq6bvbl26t1yc', 'confirmado', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.165Z', '2026-06-12T17:50:29.165Z'),
('cmqb82fjd004eq6bvrf8w8cfg', 'cmqb82fja004aq6bvd4lk8t1u', 'confirmado', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.161Z', '2026-06-12T17:50:29.161Z'),
('cmqb82fj80048q6bvge3a3xsg', 'cmqb82fj60044q6bvianym44f', 'confirmado', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.157Z', '2026-06-12T17:50:29.157Z'),
('cmqb82fj40042q6bvftehsn6p', 'cmqb82fiz003yq6bv2lar505q', 'pendiente', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.152Z', '2026-06-12T17:50:29.152Z'),
('cmqb82fir003wq6bvwjzp73uw', 'cmqb82fid003sq6bvvoprvlt7', 'pendiente', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.139Z', '2026-06-12T17:50:29.139Z'),
('cmqb82fic003qq6bv6qqibve0', 'cmqb82fi9003mq6bvsccor86g', 'confirmado', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.124Z', '2026-06-12T19:29:44.982Z'),
('cmqb82fi7003kq6bvt8phklhl', 'cmqb82fi4003gq6bvvo1f64nz', 'pendiente', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.120Z', '2026-06-12T17:50:29.120Z'),
('cmqb82fi3003eq6bv8ixnspg0', 'cmqb82fi0003aq6bvj8ueqy7c', 'pendiente', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.115Z', '2026-06-12T17:50:29.115Z'),
('cmqb82fhy0038q6bvagsr2q3y', 'cmqb82fhv0034q6bvulbi7xe4', 'pendiente', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.111Z', '2026-06-12T17:50:29.111Z')
ON CONFLICT (id) DO NOTHING;

-- GASTOS
INSERT INTO "Gasto" (id, tipo, "desc", categoria, "dropId", monto, fecha, "businessId", "createdAt") VALUES
('cmqb82fma008cq6bvckotk1v3', 'inversion', 'BORDADO', 'Inversión inicial', 'cmqb82fgg001cq6bvogbc21sq', 150, '2026-05-15', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.266Z'),
('cmqb82fm9008aq6bvmai9beb7', 'inversion', 'DISEÑO', 'Inversión inicial', 'cmqb82fgg001cq6bvogbc21sq', 23, '2026-05-15', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.265Z'),
('cmqb82fm80088q6bv3onf5w57', 'inversion', 'MOLDE', 'Inversión inicial', 'cmqb82fgg001cq6bvogbc21sq', 65, '2026-05-15', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.264Z'),
('cmqb82fm60084q6bvq6erlvh3', 'inversion', 'COSTURA', 'Inversión inicial', 'cmqb82fgg001cq6bvogbc21sq', 420, '2026-05-15', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.263Z'),
('cmqb82fm70086q6bvkcqp7wx6', 'inversion', 'TELA/PARCHE', 'Inversión inicial', 'cmqb82fgg001cq6bvogbc21sq', 238, '2026-05-15', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.263Z'),
('cmqb82fm50082q6bv5q7xdjcc', 'inversion', 'TELAFRANELA', 'Inversión inicial', 'cmqb82fgg001cq6bvogbc21sq', 738, '2026-05-15', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.262Z'),
('cmqb82fm40080q6bvhnmw7343', 'inversion', 'RIP EXTRA', 'Inversión inicial', 'cmqb82fgg001cq6bvogbc21sq', 8, '2026-05-15', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.261Z'),
('cmqb82fm3007yq6bv7kvmp2vu', 'inversion', 'UTILIDADES', 'Inversión inicial', 'cmqb82fgg001cq6bvogbc21sq', 19, '2026-05-15', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.260Z'),
('cmqb82fm3007wq6bvgxlax97r', 'gasto', 'COMIDA', 'Inversión inicial', 'cmqb82fgg001cq6bvogbc21sq', 50, '2026-05-15', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.259Z'),
('cmqb82fm2007uq6bvdlv6yoew', 'gasto', 'MOTO', 'Inversión inicial', 'cmqb82fgg001cq6bvogbc21sq', 20, '2026-05-15', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.258Z'),
('cmqb82fm1007sq6bvl1513c1q', 'gasto', 'TIKTOK ADS', 'Inversión inicial', 'cmqb82fgg001cq6bvogbc21sq', 24, '2026-05-15', 'cmqb80war0018q6bvjmnll1np', '2026-06-12T17:50:29.257Z')
ON CONFLICT (id) DO NOTHING;

-- ── STEP 3: ACTUALIZAR CONTRASEÑA ───────────────────────────
-- Usar pgcrypto para hashear la contraseña real
CREATE EXTENSION IF NOT EXISTS pgcrypto;
UPDATE "User"
SET password = crypt('netoforzze321$', gen_salt('bf', 10)),
    email = 'dforzzestudio@gmail.com'
WHERE id = 'usr_dforzze_owner';

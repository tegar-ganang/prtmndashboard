-- One-time setup script to mirror production's mart_pertamina reporting
-- schema into this database, for local/staging testing of the Log Data
-- sync feature (see app.mart_sync_job).
--
-- This is NOT an Alembic migration: mart_pertamina is owned and populated
-- by an external ETL (the sp_sync_*/usp_Migrate* stored procedures, which
-- live in prod and are not part of this repo) — this script only recreates
-- the empty table/view shapes so the app can query row counts and, once the
-- stored procedures are added separately, run syncs against it locally.
--
-- Generated via SSMS "Generate Scripts" against prod, with the `master.`
-- database prefix stripped (prod apparently has this schema inside a
-- database named `master` — do not replicate that into this server's real
-- system `master` database; run this against the app's own database
-- instead, e.g. `staging`).
--
-- Run with: run this file's contents against the target database (same one
-- the backend's POSTGRES_* env vars point to).

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'mart_pertamina')
BEGIN
    EXEC('CREATE SCHEMA mart_pertamina');
END
GO

CREATE TABLE mart_pertamina.LCV_projectCharterBudaya (
	id_project int NOT NULL,
	tanggal date NOT NULL,
	judul_project varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	CONSTRAINT PK__LCV_proj__274AE1B38C7BF31D PRIMARY KEY (id_project)
);
GO

CREATE TABLE mart_pertamina.Monitoring_LCV (
	namapegawai varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	nip varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	departemen varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	lcv_conflictofinterest varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	lcv_codeofconduct varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	lcv_laporgratifikasi varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	lcv_sosialisasi_lcv varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	lcv_lhkpn varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	training_isec varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	training_lcv varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	trainining_virtualdemoroomhsse varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	training_stressmanagement varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	training_fraudawareness varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	projectchapterbudaya varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	tahun int NULL
);
GO

CREATE TABLE mart_pertamina.abi (
	ref_wbs varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	wbs varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	nilai_usd float NULL,
	nilai_idr float NULL,
	nilai_percent float NULL,
	commitment_nilai_idr float NULL,
	commitment_percent_idr float NULL,
	sa_approved_ppn_idr float NULL,
	sa_approved_ppn_percent float NULL,
	actual_invoice_nilai_idr float NULL,
	actual_invoice_percent float NULL,
	sisa_anggaran_nilai_idr float NULL,
	sisa_anggaran_percent_idr float NULL,
	nilai_total_abi float NULL,
	keterangan_1 text COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	keterangan_2 text COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	periodedata date NULL
);
GO

CREATE TABLE mart_pertamina.abo (
	no_rk varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	jenis_kerangka_anggaran varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	anggaranwpb_osf_nilai_usd float NULL,
	anggaranwpb_osf_nilai_idr float NULL,
	anggaranwpb_osf_percent float NULL,
	commitment_spk_ppn_nilai_idr float NULL,
	commitment_spk_ppn_percent float NULL,
	sa_approved_ppn_nilai_usd float NULL,
	sa_approved_ppn_percent_usd float NULL,
	sa_approved_ppn_nilai_idr float NULL,
	sa_approved_ppn_percent_idr float NULL,
	actual_invoice_nilai_usd float NULL,
	actual_invoice_percent_usd float NULL,
	actual_invoice_nilai_idr float NULL,
	actual_invoice_percent_idr float NULL,
	sisa_anggaran_nilai_usd float NULL,
	sisa_anggaran_percent_usd float NULL,
	sisa_anggaran_nilai_idr float NULL,
	sisa_anggaran_percent_idr float NULL,
	flag nvarchar(4) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	periodedata date NULL
);
GO

CREATE TABLE mart_pertamina.airms (
	Record_ID int NOT NULL,
	[Date] date NULL,
	Asset_ID varchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	Asset_Name varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	Area varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	Availability decimal(5,2) NULL,
	Reliability decimal(5,2) NULL,
	MTBF decimal(10,2) NULL,
	MTTR decimal(5,1) NULL,
	WO_Type varchar(30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	WO_Status varchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	Maintenance_Cost decimal(15,2) NULL,
	Downtime_Type varchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	Downtime_Hours decimal(8,2) NULL,
	Lost_BOE decimal(12,2) NULL,
	Health_Index decimal(5,2) NULL,
	CONSTRAINT PK__airms__603A0C6050662FB7 PRIMARY KEY (Record_ID)
);
GO

CREATE TABLE mart_pertamina.field (
	idfield bigint NOT NULL,
	namafield varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	kode varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	CONSTRAINT field_pk PRIMARY KEY (idfield)
);
GO

CREATE TABLE mart_pertamina.hazid (
	[NO] nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	NODE_NO nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	REC_NO nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	NODE nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	GUIDEWORD nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	HAZARD nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	CONSEQUENCES nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	SAFEGUARD nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	RECOMMENDATION nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	LIKELIHOOD nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	SEVERITY nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	RISK nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	RESPONSIBILITY_PIC nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[TYPE] nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	TARGET_DATE date NULL,
	RESPONSE_PROGRESS nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	CATEGORY nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	SUB_CATEGORY nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	STATUS nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	EVIDENCE nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	COMPLETION_DATE date NULL,
	SANDI_FIELD bigint NULL,
	periodedata date NULL
);
GO

CREATE TABLE mart_pertamina.hazop (
	[NO] nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	REC_NO nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	NODE_NO nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	REC_NO_2 nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	NODE nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	DEVIATION nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	POSSIBLE_CAUSE nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	CONSEQUENCES nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	SAFEGUARD nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	RECOMMENDATION nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	LIKELIHOOD nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	SEVERITY nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	RISK nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	RESPONSIBILITY_PIC nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[TYPE] nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	TARGET_DATE date NULL,
	RESPONSE_PROGRESS nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	CATEGORY nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	SUB_CATEGORY nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	STATUS nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	EVIDENCE nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	COMPLETION_DATE date NULL,
	SME nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	SANDI_FIELD bigint NULL,
	periodedata date NULL
);
GO

CREATE TABLE mart_pertamina.hsse_izin_kerja (
	idizin varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	tanggal date NULL,
	idfield bigint NULL,
	jenis_izin_kerja varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	job_complete varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	jumlah_icc int NULL,
	status_dispensasi varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	jenis_deviasi varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	status_deviasi varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	tingkat_resiko varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	lokasi nvarchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	CONSTRAINT Data_Izin_Kerja_UNIQUE UNIQUE (idizin,tanggal,idfield,jenis_izin_kerja)
);
GO

CREATE TABLE mart_pertamina.i2aims (
	record_id bigint NULL,
	inspection_date varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	asset_id varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	asset_name varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	asset_type varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	area varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	sce_category varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	integrity_status varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	inspection_result varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	inspection_compliance float NULL,
	corrosion_rate float NULL,
	remaining_life float NULL,
	risk_rank varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	anomaly_count int NULL,
	process_safety_event varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	barrier_health int NULL,
	recommendation_status varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	inspection_cost int NULL
);
GO

CREATE TABLE mart_pertamina.lcv_karyawan (
	nip varchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	namapegawai varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	departemen varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	tahun int NOT NULL,
	lcv_conflictofinterest varchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	lcv_codeofconduct varchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	lcv_laporgratifikasi varchar(30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	lcv_sosialisasi_lcv varchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	lcv_lhkpn varchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	CONSTRAINT PK__lcv_kary__DF97D0E94D4A3F80 PRIMARY KEY (nip)
);
GO

CREATE TABLE mart_pertamina.lcv_pelatihan (
	id_pelatihan int NOT NULL,
	nama_pelatihan varchar(200) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	tanggal_mulai date NOT NULL,
	tanggal_selesai date NOT NULL,
	CONSTRAINT PK__lcv_pela__EFD2C7D876BE938C PRIMARY KEY (id_pelatihan)
);
GO

CREATE TABLE mart_pertamina.lopa (
	[NO] nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	FUNCTION_NO nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	FUNCTION_NAME nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	FUNCTION_DESCRIPTION nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	FINAL_ELEMENT nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	RECOMMENDATION nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	RRF_GAP_VALUE nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	RRF_GAP_TYPE nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	RESPONSIBILITY_PIC nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	TARGET_DATE date NULL,
	REMINDER_STATUS nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	RESPONSE_PROGRESS nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	STATUS nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	EVIDENCE nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	COMPLETION_DATE date NULL,
	SANDI_FIELD bigint NULL,
	periodedata date NULL,
	field varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL
);
GO

CREATE TABLE mart_pertamina.mit (
	area varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	noregistration_lokasi varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	noregistration_jenismit varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	noregistration_kategori varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	noregistration_tahun int NULL,
	noregistration_no int NULL,
	mitdeclarationdate nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	mittitleasset varchar(128) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	integritythreats varchar(256) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	possiblescenario varchar(512) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	consequences varchar(1024) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	availablesafeguardcontrol nvarchar(2048) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	currentrisk_likelihood int NULL,
	currentrisk_severity int NULL,
	currentrisk_risk int NULL,
	rec_no varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	recommendationaction varchar(2048) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	pic varchar(128) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	targetclosing varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	remarks varchar(512) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	progresspercent int NULL,
	overallprogresspercent int NULL,
	residualriskassessmentdate varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	residualrisk_likelihood varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	residualrisk_severity varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	residualrisk_risk int NULL,
	targetriskafterimplementedrecommendation_likelihood int NULL,
	targetriskafterimplementedrecommendation_severity int NULL,
	targetriskafterimplementedrecommendation_risk int NULL,
	mitstatus varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	evidence varchar(256) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	closingdate varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL
);
GO

CREATE TABLE mart_pertamina.moc (
	moc_number varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	change_desc text COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	issued_date date NULL,
	done varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	moc_owner varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	last_updated date NULL,
	ongoing_step varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	pic varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	status varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	idfield bigint NULL
);
GO

CREATE TABLE mart_pertamina.produksi_gas_mmscfd (
	periodedata date NOT NULL,
	sandifield bigint NULL,
	jumlah float NULL,
	keterangan varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL
);
GO

CREATE TABLE mart_pertamina.produksi_oil_bbls (
	periodedata date NOT NULL,
	sandifield bigint NULL,
	jumlah float NULL,
	keterangan varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL
);
GO

CREATE TABLE mart_pertamina.produksi_operasi_bopd (
	periodedata date NOT NULL,
	sandifield bigint NULL,
	jumlah decimal(38,0) NULL,
	keterangan varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL
);
GO

CREATE TABLE mart_pertamina.produksi_pupo_sot_bopd (
	periodedata nvarchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	sandifield int NULL,
	jumlah int NULL,
	keterangan varchar(50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL
);
GO

CREATE TABLE mart_pertamina.produksi_target (
	id bigint IDENTITY(1,1) NOT NULL,
	periodedata date NOT NULL,
	value float NULL,
	jenis_target varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	created_at datetime2(0) DEFAULT sysdatetime() NULL,
	updated_at datetime2(0) DEFAULT sysdatetime() NULL,
	jenis varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	CONSTRAINT produksi_target_pk PRIMARY KEY (id),
	CONSTRAINT produksi_target_unique_1 UNIQUE (jenis,periodedata,jenis_target)
);
GO

CREATE TABLE mart_pertamina.project (
	project_id uniqueidentifier NOT NULL,
	project_name varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	start_date date NULL,
	end_date date NULL,
	pic_pertamina varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	pic_kerjasama varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	project_type varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	CONSTRAINT project_pk PRIMARY KEY (project_id)
);
GO

CREATE TABLE mart_pertamina.project_activity (
	activity_id bigint IDENTITY(1,1) NOT NULL,
	project_id bigint NULL,
	activity_name varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	parent_activity_id bigint NULL,
	[level] int NULL,
	hours int NULL,
	duration_days int NULL,
	plan_start date NULL,
	plan_finish date NULL,
	actual_start date NULL,
	actual_finish date NULL,
	CONSTRAINT NewTable_PK PRIMARY KEY (activity_id)
);
GO

CREATE TABLE mart_pertamina.project_progress (
	periodedata date NULL,
	activities_id bigint NULL,
	project_id bigint NULL,
	progress_plan float NULL,
	actual_plan float NULL
);
GO

CREATE TABLE mart_pertamina.project_progress_summary (
	id uniqueidentifier DEFAULT newid() NOT NULL,
	project_id uniqueidentifier NULL,
	progress_date date NULL,
	actual_this_week numeric(9,2) NULL,
	actual_cumulative numeric(9,2) NULL,
	plan_this_week numeric(9,2) NULL,
	plan_cumulative numeric(9,2) NULL,
	variance_to_plan numeric(9,2) NULL,
	created_at datetimeoffset DEFAULT sysdatetimeoffset() NULL,
	updated_at datetimeoffset DEFAULT sysdatetimeoffset() NULL,
	CONSTRAINT PK__project___3213E83F896BEEA1 PRIMARY KEY (id)
);
GO

CREATE TABLE mart_pertamina.project_progress_v2 (
	id uniqueidentifier DEFAULT newid() NOT NULL,
	project_id uniqueidentifier NULL,
	periode_data date NULL,
	item_no smallint NULL,
	description varchar(1000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	wf decimal(9,2) NULL,
	previous_week_plan decimal(9,2) NULL,
	previous_week_actual decimal(9,2) NULL,
	previous_week_variance decimal(9,2) NULL,
	this_week_plan decimal(9,2) NULL,
	this_week_actual decimal(9,2) NULL,
	this_week_variance decimal(9,2) NULL,
	to_date_plan decimal(9,2) NULL,
	to_date_actual decimal(9,2) NULL,
	to_date_variance decimal(9,2) NULL,
	remarks varchar(2000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	created_at datetimeoffset DEFAULT sysdatetimeoffset() NULL,
	updated_at datetimeoffset DEFAULT sysdatetimeoffset() NULL,
	CONSTRAINT PK__project___3213E83F7BE70BA1 PRIMARY KEY (id)
);
GO

CREATE TABLE mart_pertamina.psa_zona_indicator (
	ind_type varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[indicator] varchar(500) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	unit varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	description varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	basis varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	pic_name varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	pic_email varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	january int NULL,
	february int NULL,
	march int NULL,
	april int NULL,
	may int NULL,
	june int NULL,
	july int NULL,
	august int NULL,
	september int NULL,
	october int NULL,
	november int NULL,
	december int NULL,
	ytd float NULL,
	comment varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	tahun_data varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL
);
GO
CREATE UNIQUE NONCLUSTERED INDEX UX_psa_zona_indicator ON mart_pertamina.psa_zona_indicator (  tahun_data ASC  , ind_type ASC  , indicator ASC  , pic_email ASC  )
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY] ;
GO

CREATE TABLE mart_pertamina.psa_zona_pse (
	[no] varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	zona varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	field_area varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	lokasi varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	unit_detail varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	short_description varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	event_issue_category varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	activity varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	type_location varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	date_start date NULL,
	time_start varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	barrier_prevent varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	barrier_mitigate varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	lopc_released varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	lopc_duration_hour int NULL,
	lopc_flammable_gas_kg int NULL,
	lopc_gas_in_any_hour_periode_kg int NULL,
	liquid_hc_type_material varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	lopc_hc_liquid_barrel int NULL,
	lopc_hc_liquid_in_any_one_hour_periode_kg int NULL,
	toxic_type_material varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	lopc_toxic_kg int NULL,
	lopc_toxic_in_any_one_hour_periode_kg int NULL,
	other_type_material varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	lopc_other_kg int NULL,
	lopc_other_in_any_one_hour_periode_kg int NULL,
	injured_worker varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	affect_3rd_party varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	number_injured_person int NULL,
	number_fatality int NULL,
	fire_explosion varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	damage_by_fire_explosion_usd int NULL,
	relief_device_upset_emission varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	effect_to_discharge_point_of_relief_device_upset_emission varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	pse_tier int NULL,
	causal_factor_direct_cause_1_description varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	category varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	sub_category varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	causal_factor_direct_cause_2_description varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	category_1 varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	sub_category_1 varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	causal_factor_direct_cause_3_description varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	category_2 varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	sub_category_2 varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	barrier_1_failure_description varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	category_3 varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	sub_category_3 varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	barrier_2_failure_description varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	category_4 varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	sub_category_4 varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	barrier_3_failure_description varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	category_5 varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	sub_category_5 varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	remarks nvarchar(MAX) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	treshold_tier_1_logic int NULL,
	treshold_tier_2_logic int NULL,
	treshold_tier_1_logic_1 int NULL,
	treshold_tier_2_logic_1 int NULL,
	treshold_tier_1_logic_2 int NULL,
	treshold_tier_2_logic_2 int NULL,
	treshold_tier_1_logic_3 int NULL,
	treshold_tier_2_logic_3 int NULL,
	lopc_tier_logic int NULL,
	injury_tier_logic int NULL,
	damage_tier_logic int NULL,
	relief_correction_logic varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	idfield bigint NULL
);
GO

CREATE TABLE mart_pertamina.psaims_monitoring (
	elemen_psaims varchar(512) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	program varchar(512) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	keterangan_program varchar(512) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	pic varchar(512) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	rencana_jan float NULL,
	rencana_feb float NULL,
	rencana_mar float NULL,
	rencana_apr float NULL,
	rencana_may float NULL,
	rencana_jun float NULL,
	rencana_jul float NULL,
	rencana_aug float NULL,
	rencana_sep float NULL,
	rencana_oct float NULL,
	rencana_nov float NULL,
	rencana_dec float NULL,
	realisasi_jan float NULL,
	realisasi_feb float NULL,
	realisasi_mar float NULL,
	realisasi_apr float NULL,
	realisasi_may float NULL,
	realisasi_jun float NULL,
	realisasi_jul float NULL,
	realisasi_aug float NULL,
	realisasi_sep float NULL,
	realisasi_oct float NULL,
	realisasi_nov float NULL,
	realisasi_dec float NULL,
	kumulatif_rencana float NULL,
	kumulatif_realisasi float NULL,
	kinerja float NULL,
	kinerja_keseluruhan float NULL,
	keterangan text COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	tahundata int NULL,
	bulandata int NULL,
	elemen int NULL,
	CONSTRAINT PSAIMS_UNIQUE UNIQUE (elemen_psaims,program,keterangan_program,pic)
);
GO

CREATE TABLE mart_pertamina.safemanhours (
	periodedata date NOT NULL,
	sandifield bigint NULL,
	jumlah int NULL
);
GO

CREATE TABLE mart_pertamina.lcv_pesertaPelatihan (
	id_peserta int IDENTITY(1,1) NOT NULL,
	nip varchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	id_pelatihan int NOT NULL,
	status_kehadiran varchar(20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	CONSTRAINT PK__lcv_pese__5D2F47B1B1ECADDF PRIMARY KEY (id_peserta),
	CONSTRAINT FK__lcv_peser__id_pe__33BFA6FF FOREIGN KEY (id_pelatihan) REFERENCES mart_pertamina.lcv_pelatihan(id_pelatihan),
	CONSTRAINT FK__lcv_peserta__nip__32CB82C6 FOREIGN KEY (nip) REFERENCES mart_pertamina.lcv_karyawan(nip)
);
GO

CREATE OR ALTER VIEW mart_pertamina.pbi_progress_project AS
WITH raw AS (
    SELECT
        po.project_name,
        p.activity_name,
        MAX(pp.actual_plan) AS progress_actual,
        MAX(pp.progress_plan) AS progress_plan
    FROM mart_pertamina.project_progress pp
    JOIN mart_pertamina.project_activity p ON pp.activities_id = p.activity_id
    JOIN mart_pertamina.project po ON po.project_id = p.project_id
    GROUP BY po.project_name, p.activity_name
)
SELECT
    project_name,
    activity_name,
    progress_actual / NULLIF(progress_plan, 0) AS progress_ratio
FROM raw
WHERE progress_actual / NULLIF(progress_plan, 0) IS NOT NULL
GROUP BY project_name, activity_name, progress_actual, progress_plan;
GO

CREATE OR ALTER VIEW mart_pertamina.pbi_progress_scurve as
select
	periodedata,
	project_name,
	sum(progress_plan) progress_plan,
	sum(actual_plan) progress_actual
from
	mart_pertamina.project_progress pp
join mart_pertamina.project	p on pp.project_id = p.project_id
group by
	pp.periodedata,
	p.project_name;
GO

CREATE OR ALTER VIEW mart_pertamina.vw_pie_pelatihan AS
SELECT
    p.nama_pelatihan,
    k.departemen,
    pp.status_kehadiran,
    COUNT(*) AS jumlah
FROM mart_pertamina.lcv_pesertaPelatihan pp
JOIN mart_pertamina.lcv_karyawan k
    ON pp.nip = k.nip
JOIN mart_pertamina.lcv_pelatihan p
    ON pp.id_pelatihan = p.id_pelatihan
GROUP BY
    p.nama_pelatihan,
    k.departemen,
    pp.status_kehadiran;
GO

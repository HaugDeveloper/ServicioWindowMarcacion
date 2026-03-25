-- ===========================================================================================================================================================================
-- ===========================================================================================================================================================================
-- =============================================
-- BASE DE DATOS: Usar tu BD existente
-- =============================================
-- ===========================================================================================================================================================================
-- ===========================================================================================================================================================================
	USE [BK_RECURSOS]
	GO



-- =========================================================
-- [SSCA].[SP_ADMS_CENTRO_COSTO_LISTAR]
-- =========================================================
USE [BK_RECURSOS];
GO
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE [SSCA].[SP_ADMS_PROYECTO_S10_LISTAR]
(
    @CodProyecto            VARCHAR(50) = NULL,
    @Nivel                  INT = NULL,
    @Descripcion            VARCHAR(200) = NULL,
    @CodMoneda              VARCHAR(10) = NULL,
    @ID_Padre               VARCHAR(50) = NULL,
    @ID_SUCURSAL            VARCHAR(10) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        [CodProyecto],
        [Nivel],
        [Descripcion],
        [CodMoneda],
        [CodMonedaSecundaria],
        [Abreviatura],
        [NroProyecto],
        [ID_Padre],
        [ID_SUCURSAL]
    FROM [RECURSOS_HUMANOS].[dbo].[PROYECTO_S10]
    WHERE 
        (@CodProyecto IS NULL OR CodProyecto = @CodProyecto)
        AND (@Nivel IS NULL OR Nivel = @Nivel)
        AND (@Descripcion IS NULL OR Descripcion LIKE '%' + @Descripcion + '%')
        AND (@CodMoneda IS NULL OR CodMoneda = @CodMoneda)
        AND (@ID_Padre IS NULL OR ID_Padre = @ID_Padre)
        AND (@ID_SUCURSAL IS NULL OR ID_SUCURSAL = @ID_SUCURSAL)
    ORDER BY CodProyecto;
END;
GO



-- =========================================================
-- [SSCA].[SP_ADMS_CENTRO_COSTO_LISTAR]
-- =========================================================
USE [BK_RECURSOS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROC [SSCA].[SP_ADMS_CENTRO_COSTO_LISTAR]
(
    @ID_CENTRO_COSTO        VARCHAR(20) = NULL,
    @DESCRIPCION            VARCHAR(200) = NULL,
    @CLIENTE                VARCHAR(200) = NULL,
    @ID_SUCURSAL            VARCHAR(10) = NULL, -- si aplica en tu tabla
    @COD_PROYECTO           VARCHAR(50) = NULL,
    @ESTADO                 VARCHAR(10) = 'True'
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        [ID_CENTRO_COSTO],
        [DESCRIPCION],      
        [COLOQUIAL],
        [DIRECCION],
        [CLIENTE],
        [UBICACION_FISICA],
        [PROPIETARIO],
        ISNULL([PROYECTO],'FALSE') AS PROYECTO,  
        ISNULL([AMBOS],'FALSE') AS AMBOS,
        ISNULL([ESTADO],'FALSE') AS ESTADO,
        ISNULL([ID_USU_REG],0) AS ID_USU_REG,
        ISNULL([FECHA_REGISTRO],'1753-01-01') AS FECHA_REGISTRO,
        ISNULL([ID_USUARIO_MOD],0) AS ID_USUARIO_MOD,
        ISNULL([FECHA_MODIFICACION],'1753-01-01') AS FECHA_MODIFICACION,
        ISNULL([FECHA_INICIO],'1753-01-01') AS FECHA_INICIO,
        ISNULL([IND_PLANTA],0) AS IND_PLANTA,
        [IND_NOTIFICACION_MEDICO],
        [COD_PROYECTO],
        [CODCENTROCOSTO]
    FROM [CENTRO_COSTO]
    WHERE 
        (@ESTADO IS NULL OR [ESTADO] = @ESTADO)
        AND (@ID_CENTRO_COSTO IS NULL OR [ID_CENTRO_COSTO] = @ID_CENTRO_COSTO)
        AND (@DESCRIPCION IS NULL OR [DESCRIPCION] LIKE '%' + @DESCRIPCION + '%')
        AND (@CLIENTE IS NULL OR [CLIENTE] LIKE '%' + @CLIENTE + '%')
        AND (@COD_PROYECTO IS NULL OR [COD_PROYECTO] = @COD_PROYECTO)
        AND ([COD_PROYECTO] IS NOT NULL)
    ORDER BY [DESCRIPCION];
END
GO



-- =========================================================
-- [SSCA].[ADMS_PERSONAL]
-- =========================================================
USE [BK_RECURSOS];
GO
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE TABLE [SSCA].[ADMS_DISPOSITIVO_USUARIO] (
    [ID]					INT IDENTITY(1,1) PRIMARY KEY,
	[SN]					VARCHAR(100) NOT NULL,
	[ID_SUCURSAL]			VARCHAR(3) NULL,
	[ID_CENTRO_COSTO]		VARCHAR(11) NULL,
    [COD_PROYECTO]			VARCHAR(8) NULL,
	[ID_TAREADOR]			VARCHAR(20) NULL,
    [COD_OBRERO]			VARCHAR(20) NULL,
	[ACTIVO]				BIT NOT NULL DEFAULT 1,
	[USUARIO_REGISTRO]		VARCHAR(50) NULL,
    [FECHA_REGISTRO]		DATETIME DEFAULT GETDATE(),
    [USUARIO_MODIFICADO]	VARCHAR(50) NULL,
    [FECHA_MODIFICADO]		DATETIME DEFAULT GETDATE(),
);
GO

-- DROP TABLE [SSCA].[DISPOSITIVO_USUARIO]
SELECT * FROM [SSCA].[ADMS_DISPOSITIVO_USUARIO]


-- =========================================================
-- [SSCA].[SP_DISPOSITIVO_USUARIO_LISTAR]
-- =========================================================
USE [BK_RECURSOS];
GO
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE [SSCA].[SP_ADMS_DISPOSITIVO_USUARIO_LISTAR]
(
    @PARAMETRO          INT = 0,              -- 0 = sin paginación | 1 = con paginación
    @ID                 INT = NULL,
    @SN                 VARCHAR(100) = NULL,
    @ID_SUCURSAL        VARCHAR(3) = NULL,
    @ID_CENTRO_COSTO    VARCHAR(11) = NULL,
    @COD_PROYECTO       VARCHAR(8) = NULL,
    @ID_TAREADOR        VARCHAR(20) = NULL,
    @COD_OBRERO         VARCHAR(20) = NULL,
    @ACTIVO             BIT = NULL,
    @BUSCAR             VARCHAR(100) = NULL,
    @PageNumber         INT = 1,
    @PageSize           INT = 50
)
AS
BEGIN

SET NOCOUNT ON;

IF (@PARAMETRO = 0)
BEGIN

    SELECT
        COUNT(*) OVER() AS TOTAL,
        DU.[ID],
        DU.[SN],
        DU.[ID_SUCURSAL],
		S.[DESCRIPCION] AS NOMBRE_SUCURSAL,
        DU.[ID_CENTRO_COSTO],
		CC.[DESCRIPCION] AS NOMBRE_CENTRO_COSTO,
	    CC.[COLOQUIAL] AS COLOQUIAL_CENTRO_COSTO,
        DU.[COD_PROYECTO],
		PS10.[Descripcion] AS NOMBRE_PROYECTO,
        DU.[ID_TAREADOR],
		LPS101.[Descripcion] AS NOMBRE_TAREADOR,
        DU.[COD_OBRERO],
		LPS102.[Descripcion] AS NOMBRE_OBRERO,
        DU.[ACTIVO],
        DU.[USUARIO_REGISTRO],
        DU.[FECHA_REGISTRO],
        DU.[USUARIO_MODIFICADO],
        DU.[FECHA_MODIFICADO]

    FROM [SSCA].[ADMS_DISPOSITIVO_USUARIO] DU
		LEFT JOIN [RECURSOS_HUMANOS].[dbo].[SUCURSAL] S ON S.ID_SUCURSAL = DU.ID_SUCURSAL
		LEFT JOIN [RECURSOS_HUMANOS].[dbo].[CENTRO_COSTO] CC ON CC.ID_CENTRO_COSTO = DU.ID_CENTRO_COSTO
		LEFT JOIN [RECURSOS_HUMANOS].[dbo].[PROYECTO_S10] PS10 ON PS10.CodProyecto = DU.COD_PROYECTO
		LEFT JOIN [RECURSOS_HUMANOS].[dbo].[Listar_Personal_S10] LPS101 ON LPS101.CodProyectoNoProd = DU.ID_TAREADOR
		LEFT JOIN [RECURSOS_HUMANOS].[dbo].[Listar_Personal_S10] LPS102 ON LPS101.CodObrero = DU.COD_OBRERO

    WHERE
        (@ID IS NULL OR DU.[ID] = @ID)
        AND (@SN IS NULL OR DU.[SN] = @SN)
        AND (@ID_SUCURSAL IS NULL OR DU.[ID_SUCURSAL] = @ID_SUCURSAL)
        AND (@ID_CENTRO_COSTO IS NULL OR DU.[ID_CENTRO_COSTO] = @ID_CENTRO_COSTO)
        AND (@COD_PROYECTO IS NULL OR DU.[COD_PROYECTO] = @COD_PROYECTO)
        AND (@ID_TAREADOR IS NULL OR DU.[ID_TAREADOR] = @ID_TAREADOR)
        AND (@COD_OBRERO IS NULL OR DU.[COD_OBRERO] = @COD_OBRERO)
        AND (@ACTIVO IS NULL OR DU.[ACTIVO] = @ACTIVO)

        AND (
            @BUSCAR IS NULL OR @BUSCAR = '' OR
            DU.[SN] LIKE '%' + @BUSCAR + '%' OR
            DU.[ID_SUCURSAL] LIKE '%' + @BUSCAR + '%' OR
            DU.[ID_CENTRO_COSTO] LIKE '%' + @BUSCAR + '%' OR
            DU.[COD_PROYECTO] LIKE '%' + @BUSCAR + '%' OR
            DU.[ID_TAREADOR] LIKE '%' + @BUSCAR + '%' OR
            DU.[COD_OBRERO] LIKE '%' + @BUSCAR + '%'
        )

    ORDER BY DU.[ID] ASC;

END

ELSE
BEGIN

    DECLARE @OFFSET INT = (@PageNumber - 1) * @PageSize;

    ;WITH DISPOSITIVO_FILTRADO AS
    (

        SELECT
			DU.[ID],
			DU.[SN],
			DU.[ID_SUCURSAL],
			S.[DESCRIPCION] AS NOMBRE_SUCURSAL,
			DU.[ID_CENTRO_COSTO],
			CC.[DESCRIPCION] AS NOMBRE_CENTRO_COSTO,
			CC.[COLOQUIAL] AS COLOQUIAL_CENTRO_COSTO,
			DU.[COD_PROYECTO],
			PS10.[Descripcion] AS NOMBRE_PROYECTO,
			DU.[ID_TAREADOR],
			LPS101.[Descripcion] AS NOMBRE_TAREADOR,
			DU.[COD_OBRERO],
			LPS102.[Descripcion] AS NOMBRE_OBRERO,
			DU.[ACTIVO],
			DU.[USUARIO_REGISTRO],
			DU.[FECHA_REGISTRO],
			DU.[USUARIO_MODIFICADO],
			DU.[FECHA_MODIFICADO],
            COUNT(*) OVER() AS TOTAL

        FROM [SSCA].[ADMS_DISPOSITIVO_USUARIO] DU
			LEFT JOIN [RECURSOS_HUMANOS].[dbo].[SUCURSAL] S ON S.ID_SUCURSAL = DU.ID_SUCURSAL
			LEFT JOIN [RECURSOS_HUMANOS].[dbo].[CENTRO_COSTO] CC ON CC.ID_CENTRO_COSTO = DU.ID_CENTRO_COSTO
			LEFT JOIN [RECURSOS_HUMANOS].[dbo].[PROYECTO_S10] PS10 ON PS10.CodProyecto = DU.COD_PROYECTO
			LEFT JOIN [RECURSOS_HUMANOS].[dbo].[Listar_Personal_S10] LPS101 ON LPS101.CodProyectoNoProd = DU.ID_TAREADOR
			LEFT JOIN [RECURSOS_HUMANOS].[dbo].[Listar_Personal_S10] LPS102 ON LPS101.CodObrero = DU.COD_OBRERO

        WHERE
            (@ID IS NULL OR DU.[ID] = @ID)
            AND (@SN IS NULL OR DU.[SN] = @SN)
            AND (@ID_SUCURSAL IS NULL OR DU.[ID_SUCURSAL] = @ID_SUCURSAL)
            AND (@ID_CENTRO_COSTO IS NULL OR DU.[ID_CENTRO_COSTO] = @ID_CENTRO_COSTO)
            AND (@COD_PROYECTO IS NULL OR DU.[COD_PROYECTO] = @COD_PROYECTO)
            AND (@ID_TAREADOR IS NULL OR DU.[ID_TAREADOR] = @ID_TAREADOR)
            AND (@COD_OBRERO IS NULL OR DU.[COD_OBRERO] = @COD_OBRERO)
            AND (@ACTIVO IS NULL OR DU.[ACTIVO] = @ACTIVO)

            AND (
                @BUSCAR IS NULL OR @BUSCAR = '' OR
                DU.[SN] LIKE '%' + @BUSCAR + '%' OR
                DU.[ID_SUCURSAL] LIKE '%' + @BUSCAR + '%' OR
                DU.[ID_CENTRO_COSTO] LIKE '%' + @BUSCAR + '%' OR
                DU.[COD_PROYECTO] LIKE '%' + @BUSCAR + '%' OR
                DU.[ID_TAREADOR] LIKE '%' + @BUSCAR + '%' OR
                DU.[COD_OBRERO] LIKE '%' + @BUSCAR + '%'
            )
    )

    SELECT *
    FROM DISPOSITIVO_FILTRADO
    ORDER BY ID ASC
    OFFSET @OFFSET ROWS FETCH NEXT @PageSize ROWS ONLY;

END

END
GO



-- =========================================================
-- [SSCA].[SP_DISPOSITIVO_USUARIO_UPSERT]
-- =========================================================
USE [BK_RECURSOS];
GO
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE [SSCA].[SP_ADMS_DISPOSITIVO_USUARIO_UPSERT]
(
    @ID                     INT = NULL,
    @SN                     VARCHAR(MAX),
    @ID_SUCURSAL            VARCHAR(3) = NULL,
    @ID_CENTRO_COSTO        VARCHAR(11) = NULL,
    @COD_PROYECTO           VARCHAR(8) = NULL,
    @ID_TAREADOR            VARCHAR(20) = NULL,
    @COD_OBRERO             VARCHAR(20) = NULL,
    @ACTIVO                 BIT = 1,
    @USUARIO                VARCHAR(50)
)
AS
BEGIN

SET NOCOUNT ON;

DECLARE @ID_GENERADO INT

IF (@ID IS NULL OR NOT EXISTS (
        SELECT 1 
        FROM [SSCA].[ADMS_DISPOSITIVO_USUARIO] 
        WHERE ID = @ID
))
BEGIN

    INSERT INTO [SSCA].[ADMS_DISPOSITIVO_USUARIO]
    (
        SN,
        ID_SUCURSAL,
        ID_CENTRO_COSTO,
        COD_PROYECTO,
        ID_TAREADOR,
        COD_OBRERO,
        ACTIVO,
        USUARIO_REGISTRO,
        FECHA_REGISTRO
    )
    VALUES
    (
        @SN,
        @ID_SUCURSAL,
        @ID_CENTRO_COSTO,
        @COD_PROYECTO,
        @ID_TAREADOR,
        @COD_OBRERO,
        @ACTIVO,
        @USUARIO,
        GETDATE()
    )

    SET @ID_GENERADO = SCOPE_IDENTITY()

END
ELSE
BEGIN

    UPDATE [SSCA].[ADMS_DISPOSITIVO_USUARIO]
    SET
        SN = @SN,
        ID_SUCURSAL = @ID_SUCURSAL,
        ID_CENTRO_COSTO = @ID_CENTRO_COSTO,
        COD_PROYECTO = @COD_PROYECTO,
        ID_TAREADOR = @ID_TAREADOR,
        COD_OBRERO = @COD_OBRERO,
        ACTIVO = @ACTIVO,
        USUARIO_MODIFICADO = @USUARIO,
        FECHA_MODIFICADO = GETDATE()
    WHERE ID = @ID

    SET @ID_GENERADO = @ID

END


SELECT 
    ID,
    SN,
    ID_SUCURSAL,
    ID_CENTRO_COSTO,
    COD_PROYECTO,
    ID_TAREADOR,
    COD_OBRERO,
    ACTIVO,
    USUARIO_REGISTRO,
    FECHA_REGISTRO,
    USUARIO_MODIFICADO,
    FECHA_MODIFICADO
FROM [SSCA].[ADMS_DISPOSITIVO_USUARIO]
WHERE ID = @ID_GENERADO

END
GO



-- =========================================================
-- [SSCA].[ADMS_PERSONAL]
-- =========================================================
USE [BK_RECURSOS];
GO
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE TABLE [SSCA].[ADMS_PERSONAL] (
    [ID]					INT IDENTITY(1,1) PRIMARY KEY,
	[SN]					VARCHAR(MAX) NOT NULL,
    [CodObrero]				VARCHAR(20) NOT NULL,
    [Descripcion]			VARCHAR(200) NOT NULL,
    [DNI]					VARCHAR(20) NULL,
    [CodOcupacion]			VARCHAR(20) NULL,
    [Ocupacion]				VARCHAR(200) NULL,
    [NroEsquemaPlanilla]	VARCHAR(50) NULL,
    [Motivo]				VARCHAR(150) NULL,
    [CodInsumo]				VARCHAR(50) NULL,
    [Insumo]				VARCHAR(100) NULL,
    [CodSucursal]			VARCHAR(10) NULL,
    [CodIdentificador]		VARCHAR(20) NULL,
    [CodProyecto]			VARCHAR(20) NULL,
    [CodProyectoNoProd]		VARCHAR(20) NULL,
	[ID_CENTRO_COSTO]		VARCHAR(11) NULL,
	[CENTRO_COSTO]			VARCHAR(255) NULL,
    [COLOQUIAL]				VARCHAR(255) NULL,
    [DIRECCION]				VARCHAR(255) NULL,
	[COD_PROYECTO]			VARCHAR(15) NULL,
	[CODCENTROCOSTO]		VARCHAR(5) NULL,
    [Procesado]				BIT NOT NULL DEFAULT 0,
	[Activo]				BIT NOT NULL DEFAULT 1,
	[Usuario_Registro]		VARCHAR(50) NULL,
    [Fecha_Registro]		DATETIME DEFAULT GETDATE(),
    [Usuario_Modificado]	VARCHAR(50) NULL,
    [Fecha_Modificado]		DATETIME DEFAULT GETDATE(),
	[payload]				VARCHAR(MAX) NULL
);
GO
-- DROP TABLE [SSCA].[ADMS_PERSONAL]
SELECT * FROM [SSCA].[ADMS_PERSONAL]



-- =========================================================
-- [SSCA].[SP_ADMS_PERSONAL_SYNC]
-- =========================================================
USE [BK_RECURSOS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE [SSCA].[SP_ADMS_PERSONAL_SYNC]
(
    @JSON NVARCHAR(MAX),           
    @SN VARCHAR(MAX),
    @CodSucursal VARCHAR(10) = NULL,
    @CodProyectoNoProd VARCHAR(20) = NULL,
    @IdTareador VARCHAR(20) = NULL,
    @CodigoTrabajador VARCHAR(20) = NULL,
    @usuario NVARCHAR(255) = NULL  
)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

		SET @CodigoTrabajador = NULLIF(@CodigoTrabajador, '');
		SET @IdTareador = NULLIF(@IdTareador, '');

        -- 1️ Convertir JSON en tabla temporal con los nombres exactos de la tabla
        DECLARE @tmp TABLE (
            CodObrero VARCHAR(20),
            Descripcion VARCHAR(200),
            DNI VARCHAR(20),
            CodOcupacion VARCHAR(20),
            Ocupacion VARCHAR(200),
            NroEsquemaPlanilla VARCHAR(50),
            Motivo VARCHAR(150),
            CodInsumo VARCHAR(50),
            Insumo VARCHAR(100),
            CodSucursal VARCHAR(10),
            CodIdentificador VARCHAR(20),
            CodProyecto VARCHAR(20),
            CodProyectoNoProd VARCHAR(20),
            ID_CENTRO_COSTO VARCHAR(11),
            CENTRO_COSTO VARCHAR(255),
            COLOQUIAL VARCHAR(255),
            DIRECCION VARCHAR(255),
            COD_PROYECTO VARCHAR(15),
            CODCENTROCOSTO VARCHAR(5),
            Activo BIT,
            payload VARCHAR(MAX)
        );

        INSERT INTO @tmp
        SELECT 
            ISNULL(CodObrero, '') as CodObrero,  -- Aseguramos que no sea NULL
            ISNULL(Descripcion, '') as Descripcion,
            DNI,
            CodOcupacion,
            Ocupacion,
            NroEsquemaPlanilla,
            Motivo,
            CodInsumo,
            Insumo,
            CodSucursal,
            CodIdentificador,
            CodProyecto,
            CodProyectoNoProd,
            ID_CENTRO_COSTO,
            CENTRO_COSTO,
            COLOQUIAL,
            DIRECCION,
            COD_PROYECTO,
            CODCENTROCOSTO,
            ISNULL(Activo, 1) AS Activo,
            payload
        FROM OPENJSON(@JSON)
        WITH (
            CodObrero VARCHAR(20) '$.CodObrero',
            Descripcion VARCHAR(200) '$.Descripcion',
            DNI VARCHAR(20) '$.DNI',
            CodOcupacion VARCHAR(20) '$.CodOcupacion',
            Ocupacion VARCHAR(200) '$.Ocupacion',
            NroEsquemaPlanilla VARCHAR(50) '$.NroEsquemaPlanilla',
            Motivo VARCHAR(150) '$.Motivo',
            CodInsumo VARCHAR(50) '$.CodInsumo',
            Insumo VARCHAR(100) '$.Insumo',
            CodSucursal VARCHAR(10) '$.CodSucursal',
            CodIdentificador VARCHAR(20) '$.CodIdentificador',
            CodProyecto VARCHAR(20) '$.CodProyecto',
            CodProyectoNoProd VARCHAR(20) '$.CodProyectoNoProd',
            ID_CENTRO_COSTO VARCHAR(11) '$.ID_CENTRO_COSTO',
            CENTRO_COSTO VARCHAR(255) '$.CENTRO_COSTO',
            COLOQUIAL VARCHAR(255) '$.COLOQUIAL',
            DIRECCION VARCHAR(255) '$.DIRECCION',
            COD_PROYECTO VARCHAR(15) '$.COD_PROYECTO',
            CODCENTROCOSTO VARCHAR(5) '$.CODCENTROCOSTO',
            Activo BIT '$.Activo',
            payload VARCHAR(MAX) '$.payload'
        );

        -- Verificar que no hay CodObrero NULL
        IF EXISTS (SELECT 1 FROM @tmp WHERE CodObrero IS NULL OR CodObrero = '')
        BEGIN
            RAISERROR('Error: CodObrero no puede ser NULL o vacío', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 2️ Actualizar registros existentes basado en DNI y SN
        UPDATE P
        SET 
            P.CodObrero = S.CodObrero,
            P.Descripcion = S.Descripcion,
            P.DNI = S.DNI,
            P.CodOcupacion = S.CodOcupacion,
            P.Ocupacion = S.Ocupacion,
            P.NroEsquemaPlanilla = S.NroEsquemaPlanilla,
            P.Motivo = S.Motivo,
            P.CodInsumo = S.CodInsumo,
            P.Insumo = S.Insumo,
            P.CodSucursal = ISNULL(@CodSucursal, S.CodSucursal),
            P.CodIdentificador = S.CodIdentificador,
            P.CodProyecto = S.CodProyecto,
            P.CodProyectoNoProd = ISNULL(@CodProyectoNoProd, S.CodProyectoNoProd),
            P.ID_CENTRO_COSTO = S.ID_CENTRO_COSTO,
            P.CENTRO_COSTO = S.CENTRO_COSTO,
            P.COLOQUIAL = S.COLOQUIAL,
            P.DIRECCION = S.DIRECCION,
            P.COD_PROYECTO = S.COD_PROYECTO,
            P.CODCENTROCOSTO = S.CODCENTROCOSTO,
            P.Activo = S.Activo,
            P.Procesado = 1,
            P.Usuario_Modificado = @usuario,
            P.Fecha_Modificado = GETDATE(),
            P.payload = CASE 
                WHEN P.payload IS NULL OR P.payload = '' THEN S.payload
                WHEN S.payload IS NOT NULL AND S.payload != '' 
                    THEN CONCAT(P.payload, ' | ', S.payload)
                ELSE P.payload
            END
        FROM [SSCA].[ADMS_PERSONAL] P
        INNER JOIN @tmp S
            ON P.DNI = S.DNI
            AND P.SN = @SN
        WHERE (P.Activo = 1 OR P.Activo = S.Activo)
          AND (@CodigoTrabajador IS NULL OR P.CodObrero = @CodigoTrabajador);

        -- 3️ Insertar nuevos registros (no existen para este SN y DNI)
        INSERT INTO [SSCA].[ADMS_PERSONAL]
        (
            SN, CodObrero, Descripcion, DNI, CodOcupacion, Ocupacion,
            NroEsquemaPlanilla, Motivo, CodInsumo, Insumo,
            CodSucursal, CodIdentificador, CodProyecto, CodProyectoNoProd,
            ID_CENTRO_COSTO, CENTRO_COSTO, COLOQUIAL, DIRECCION,
            COD_PROYECTO, CODCENTROCOSTO, Activo, Procesado,
            Usuario_Registro, Fecha_Registro, payload
        )
        SELECT 
            @SN, 
            S.CodObrero, 
            S.Descripcion, 
            S.DNI, 
            S.CodOcupacion, 
            S.Ocupacion,
            S.NroEsquemaPlanilla, 
            S.Motivo, 
            S.CodInsumo, 
            S.Insumo,
            ISNULL(@CodSucursal, S.CodSucursal), 
            S.CodIdentificador, 
            S.CodProyecto,
            ISNULL(@CodProyectoNoProd, S.CodProyectoNoProd), 
            S.ID_CENTRO_COSTO, 
            S.CENTRO_COSTO, 
            S.COLOQUIAL, 
            S.DIRECCION,
            S.COD_PROYECTO, 
            S.CODCENTROCOSTO, 
            S.Activo, 
            1, 
            @usuario, 
            GETDATE(), 
            S.payload
        FROM @tmp S
        WHERE NOT EXISTS (
            SELECT 1 FROM [SSCA].[ADMS_PERSONAL] P
            WHERE P.SN = @SN 
              AND P.DNI = S.DNI
        )
        AND (@CodigoTrabajador IS NULL OR S.CodObrero = @CodigoTrabajador);

        -- 4️ Desactivar registros que ya no están en el JSON
        IF @CodigoTrabajador IS NULL
        BEGIN
            UPDATE P
            SET P.Activo = 0,
                P.Procesado = 1,
                P.Usuario_Modificado = @usuario,
                P.Fecha_Modificado = GETDATE(),
                P.payload = CONCAT(ISNULL(P.payload, ''), ' | DESACTIVADO POR SINCRONIZACION')
            FROM [SSCA].[ADMS_PERSONAL] P
            LEFT JOIN @tmp S
                ON P.DNI = S.DNI
            WHERE P.SN = @SN
              AND P.Activo = 1
              AND S.DNI IS NULL
              AND (@CodSucursal IS NULL OR P.CodSucursal = @CodSucursal)
              AND (@CodProyectoNoProd IS NULL OR P.CodProyectoNoProd = @CodProyectoNoProd);
        END

        COMMIT TRANSACTION;

        -- Retornar los registros procesados
        SELECT 
            P.CodObrero,
            P.Descripcion,
            P.DNI,
            P.CodOcupacion,
            P.Ocupacion,
            P.NroEsquemaPlanilla,
            P.Motivo,
            P.CodInsumo,
            P.Insumo,
            P.CodSucursal,
            P.CodIdentificador,
            P.CodProyecto,
            P.CodProyectoNoProd,
            P.ID_CENTRO_COSTO,
            P.CENTRO_COSTO,
            P.COLOQUIAL,
            P.DIRECCION,
            P.COD_PROYECTO,
            P.CODCENTROCOSTO,
            P.Activo,
            P.payload
        FROM [SSCA].[ADMS_PERSONAL] P
        INNER JOIN @tmp S ON P.DNI = S.DNI
        WHERE P.SN = @SN
          AND P.Activo = 1
          AND (@CodigoTrabajador IS NULL OR P.CodObrero = @CodigoTrabajador);

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH;
END;
GO



-- =========================================================
-- [SSCA].[ADMS_MARCACIONES]
-- =========================================================
USE [BK_RECURSOS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [SSCA].[ADMS_MARCACIONES] (
    [ID]                BIGINT IDENTITY(1,1) PRIMARY KEY,
    [SN]                VARCHAR(50) NOT NULL,
    [PIN]               VARCHAR(20) NOT NULL,
    [FECHA_MARCACION]   DATE NOT NULL,                -- Solo fecha
    [HORA_MARCACION]    TIME NOT NULL,                -- Solo hora
    [ESTADO]            INT NOT NULL DEFAULT 0,       -- 0=entrada, 1=salida
    [VERIF]             INT NOT NULL DEFAULT 0,       -- 1=huella, 2=tarjeta, etc
    [CAMPO4]            INT DEFAULT 0,                -- 4to campo (reservado)
    [CAMPO5]            INT DEFAULT 0,                -- 5to campo (reservado)
    [CAMPO6]            INT DEFAULT 0,                -- 6to campo (reservado)
    [WORK_CODE]         INT DEFAULT 255,              -- 7mo campo (work code)
    [CAMPO8]            INT DEFAULT 0,                -- 8vo campo (reservado)
    [CAMPO9]            INT DEFAULT 0,                -- 9no campo (reservado)
    [CodObrero]         VARCHAR(20) NULL,             -- Relación con ADMS_PERSONAL.CodObrero
    [Procesado]         BIT DEFAULT 0,                 -- Para proceso de nómina
    [Fecha_Registro]    DATETIME DEFAULT GETDATE(),
	[Fecha_Modificado]    DATETIME DEFAULT GETDATE(),
    [payload]           VARCHAR(MAX) NULL              -- Línea original
);

-- Índices
CREATE INDEX IX_ADMS_MARCACIONES_SN ON [SSCA].[ADMS_MARCACIONES] (SN);
CREATE INDEX IX_ADMS_MARCACIONES_PIN ON [SSCA].[ADMS_MARCACIONES] (PIN);
CREATE INDEX IX_ADMS_MARCACIONES_FECHA ON [SSCA].[ADMS_MARCACIONES] (FECHA_MARCACION);
CREATE INDEX IX_ADMS_MARCACIONES_PROCESADO ON [SSCA].[ADMS_MARCACIONES] (Procesado);
GO

-- DROP TABLE [SSCA].[ADMS_MARCACIONES]
SELECT * FROM [SSCA].[ADMS_MARCACIONES]



-- =========================================================
-- [SSCA].[SP_ADMS_MARCACIONES_INSERT]
-- =========================================================
USE [BK_RECURSOS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE [SSCA].[SP_ADMS_MARCACIONES_INSERT]
(
    @jsonMarcaciones NVARCHAR(MAX),
    @sn VARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Tabla temporal
        DECLARE @tmp TABLE (
            PIN VARCHAR(20),
            FECHA_COMPLETA DATETIME,                   -- Fecha y hora completas del dispositivo
            ESTADO INT,
            VERIF INT,
            CAMPO4 INT,
            CAMPO5 INT,
            CAMPO6 INT,
            WORK_CODE INT,
            CAMPO8 INT,
            CAMPO9 INT,
            LINEA_ORIGINAL VARCHAR(500)
        );

        INSERT INTO @tmp
        SELECT 
            PIN,
            FECHA_COMPLETA,
            ESTADO,
            VERIF,
            ISNULL(CAMPO4, 0),
            ISNULL(CAMPO5, 0),
            ISNULL(CAMPO6, 0),
            ISNULL(WORK_CODE, 255),
            ISNULL(CAMPO8, 0),
            ISNULL(CAMPO9, 0),
            LINEA_ORIGINAL
        FROM OPENJSON(@jsonMarcaciones)
        WITH (
            PIN VARCHAR(20) '$.PIN',
            FECHA_COMPLETA DATETIME '$.FECHA_COMPLETA',
            ESTADO INT '$.ESTADO',
            VERIF INT '$.VERIF',
            CAMPO4 INT '$.CAMPO4',
            CAMPO5 INT '$.CAMPO5',
            CAMPO6 INT '$.CAMPO6',
            WORK_CODE INT '$.WORK_CODE',
            CAMPO8 INT '$.CAMPO8',
            CAMPO9 INT '$.CAMPO9',
            LINEA_ORIGINAL VARCHAR(500) '$.LINEA_ORIGINAL'
        );

        -- Insertar marcaciones nuevas separando fecha y hora
        INSERT INTO [SSCA].[ADMS_MARCACIONES] 
        (
            SN, 
            PIN, 
            FECHA_MARCACION,
            HORA_MARCACION,
            ESTADO, 
            VERIF,
            CAMPO4,
            CAMPO5,
            CAMPO6,
            WORK_CODE,
            CAMPO8,
            CAMPO9,
            CodObrero,
            payload
        )
        SELECT 
            @sn,
            t.PIN,
            CAST(t.FECHA_COMPLETA AS DATE),           -- Solo la fecha
            CAST(t.FECHA_COMPLETA AS TIME),           -- Solo la hora
            t.ESTADO,
            t.VERIF,
            t.CAMPO4,
            t.CAMPO5,
            t.CAMPO6,
            t.WORK_CODE,
            t.CAMPO8,
            t.CAMPO9,
            p.CodObrero,
            t.LINEA_ORIGINAL
        FROM @tmp t
        LEFT JOIN [SSCA].[ADMS_PERSONAL] p 
            ON p.SN = @sn 
            AND p.DNI = t.PIN
            AND p.Activo = 1
        WHERE NOT EXISTS (
            SELECT 1 FROM [SSCA].[ADMS_MARCACIONES] m
            WHERE m.SN = @sn
              AND m.PIN = t.PIN
              AND m.FECHA_MARCACION = CAST(t.FECHA_COMPLETA AS DATE)
              AND m.HORA_MARCACION = CAST(t.FECHA_COMPLETA AS TIME)
        );

        DECLARE @insertados INT = @@ROWCOUNT;

        COMMIT TRANSACTION;

        SELECT 
            @insertados as registros_insertados,
            @sn as dispositivo_sn;

    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH;
END;
GO



-- =============================================
-- TABLA: ADMS_HUELLAS (FINGERPRINTS)
-- =============================================
USE [BK_RECURSOS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE SSCA.ADMS_HUELLAS (
    ID_HUELLA           BIGINT IDENTITY(1,1) PRIMARY KEY,
    
    -- Identificación
    SN_DISPOSITIVO      VARCHAR(50) NOT NULL,
    PIN                 VARCHAR(20) NOT NULL,
    FINGER_ID           INT NOT NULL,           -- 0-9 (dedo)
    
    -- Datos de la huella
    TEMPLATE_BASE64     NVARCHAR(MAX),           -- Template en base64
    SIZE_BYTES          INT,                      -- Tamaño en bytes
    VALID               BIT DEFAULT 1,            -- 1=Activo, 0=Inactivo
    
    -- Versión/formato
    FORMATO             INT DEFAULT 0,            -- Formato del template
    MAJOR_VER           INT DEFAULT 10,           -- Versión mayor
    MINOR_VER           INT DEFAULT 0,            -- Versión menor
    
    -- Metadatos
    FECHA_RECIBIDO      DATETIME2 DEFAULT GETDATE(),
    FECHA_ACTUALIZACION DATETIME2,
    ORIGEN              VARCHAR(50),               -- 'DEVICE', 'MANUAL', 'IMPORT'
    
    -- Control
    ACTIVO              BIT DEFAULT 1,
    USUARIO_CREACION    VARCHAR(50) DEFAULT SYSTEM_USER,
    FECHA_CREACION      DATETIME2 DEFAULT GETDATE(),
    
    -- Unique constraint por dispositivo/pin/dedo
    CONSTRAINT UQ_ADMS_HUELLA UNIQUE (SN_DISPOSITIVO, PIN, FINGER_ID)
);

-- Índices para búsquedas rápidas
CREATE INDEX IX_ADMS_HUELLAS_SN_PIN ON SSCA.ADMS_HUELLAS(SN_DISPOSITIVO, PIN);
CREATE INDEX IX_ADMS_HUELLAS_PIN ON SSCA.ADMS_HUELLAS(PIN);
CREATE INDEX IX_ADMS_HUELLAS_FECHA ON SSCA.ADMS_HUELLAS(FECHA_RECIBIDO DESC);
GO

-- =============================================
-- TABLA: ADMS_FACIALES (FACE TEMPLATES)
-- =============================================
USE [BK_RECURSOS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE SSCA.ADMS_FACIALES (
    ID_FACIAL           BIGINT IDENTITY(1,1) PRIMARY KEY,
    
    -- Identificación
    SN_DISPOSITIVO      VARCHAR(50) NOT NULL,
    PIN                 VARCHAR(20) NOT NULL,
    FACE_ID             INT NOT NULL,           -- 0-9 (múltiples rostros por persona)
    
    -- Datos del facial
    TEMPLATE_BASE64     NVARCHAR(MAX),           -- Template facial en base64
    SIZE_BYTES          INT,                      -- Tamaño en bytes
    VALID               BIT DEFAULT 1,            -- 1=Activo, 0=Inactivo
    DURESS              BIT DEFAULT 0,            -- 1=Modo coacción
    
    -- Tipo de facial
    TIPO_FACIAL         INT NOT NULL,             -- 2=Infrarrojo, 9=Luz visible
    TIPO_DESCRIPCION    VARCHAR(50),              -- 'INFRARROJO', 'VISIBLE', 'MIXTO'
    
    -- Versión/formato
    FORMATO             INT DEFAULT 0,
    MAJOR_VER           INT DEFAULT 39,           -- Versión mayor (39 para SpeedFace)
    MINOR_VER           INT DEFAULT 1,            -- Versión menor
    
    -- Metadatos
    FECHA_RECIBIDO      DATETIME2 DEFAULT GETDATE(),
    FECHA_ACTUALIZACION DATETIME2,
    ORIGEN              VARCHAR(50),               -- 'DEVICE', 'MANUAL', 'IMPORT'
    
    -- Control
    ACTIVO              BIT DEFAULT 1,
    USUARIO_CREACION    VARCHAR(50) DEFAULT SYSTEM_USER,
    FECHA_CREACION      DATETIME2 DEFAULT GETDATE(),
    
    -- Unique constraint por dispositivo/pin/face_id/tipo
    CONSTRAINT UQ_ADMS_FACIAL UNIQUE (SN_DISPOSITIVO, PIN, FACE_ID, TIPO_FACIAL)
);

CREATE INDEX IX_ADMS_FACIALES_SN_PIN ON SSCA.ADMS_FACIALES(SN_DISPOSITIVO, PIN);
CREATE INDEX IX_ADMS_FACIALES_PIN ON SSCA.ADMS_FACIALES(PIN);
CREATE INDEX IX_ADMS_FACIALES_TIPO ON SSCA.ADMS_FACIALES(TIPO_FACIAL);
CREATE INDEX IX_ADMS_FACIALES_FECHA ON SSCA.ADMS_FACIALES(FECHA_RECIBIDO DESC);
GO



-- =============================================
-- SP: SSCA.SP_ADMS_HUELLAS_UPSERT
-- Inserta o actualiza faciales por PIN
-- =============================================
USE [BK_RECURSOS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE SSCA.SP_ADMS_HUELLAS_UPSERT
    @pSN_DISPOSITIVO        VARCHAR(50),
    @pPIN                   VARCHAR(20),
    @pJSON_HUELLAS          NVARCHAR(MAX),      -- JSON con array de huellas
    @pORIGEN                VARCHAR(50) = 'DEVICE',
    @pUSUARIO               VARCHAR(50) = NULL,
    @pIP                    VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Tabla para almacenar el JSON parseado
    DECLARE @JSON_TABLE TABLE (
        FINGER_ID           INT,
        TEMPLATE_BASE64     NVARCHAR(MAX),
        SIZE_BYTES          INT,
        VALID               BIT,
        FORMATO             INT,
        MAJOR_VER           INT,
        MINOR_VER           INT
    );

    -- Tabla para almacenar el resultado de cada operación
    DECLARE @Resultado TABLE (
        ACCION              VARCHAR(20),
        FINGER_ID           INT,
        ID_HUELLA           BIGINT
    );

    -- Parsear el JSON recibido
    INSERT INTO @JSON_TABLE (FINGER_ID, TEMPLATE_BASE64, SIZE_BYTES, VALID, FORMATO, MAJOR_VER, MINOR_VER)
    SELECT
        FINGER_ID,
        TEMPLATE_BASE64,
        SIZE_BYTES,
        ISNULL(VALID, 1),
        ISNULL(FORMATO, 0),
        ISNULL(MAJOR_VER, 10),
        ISNULL(MINOR_VER, 0)
    FROM OPENJSON(@pJSON_HUELLAS)
    WITH (
        FINGER_ID       INT             '$.finger_id',
        TEMPLATE_BASE64 NVARCHAR(MAX)   '$.template_base64',
        SIZE_BYTES      INT             '$.size',
        VALID           BIT             '$.valid',
        FORMATO         INT             '$.formato',
        MAJOR_VER       INT             '$.major_ver',
        MINOR_VER       INT             '$.minor_ver'
    );

    BEGIN TRANSACTION;
    BEGIN TRY
        -- Procesar cada huella del JSON de forma independiente
        DECLARE @FINGER_ID INT, @TEMPLATE_BASE64 NVARCHAR(MAX), @SIZE_BYTES INT,
                @VALID BIT, @FORMATO INT, @MAJOR_VER INT, @MINOR_VER INT,
                @ID_HUELLA BIGINT;

        DECLARE huella_cursor CURSOR FOR
        SELECT FINGER_ID, TEMPLATE_BASE64, SIZE_BYTES, VALID, FORMATO, MAJOR_VER, MINOR_VER
        FROM @JSON_TABLE;

        OPEN huella_cursor;
        FETCH NEXT FROM huella_cursor INTO @FINGER_ID, @TEMPLATE_BASE64, @SIZE_BYTES, @VALID, @FORMATO, @MAJOR_VER, @MINOR_VER;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- 1. Buscar si ya existe un registro para este par (PIN, FINGER_ID)
            SELECT @ID_HUELLA = ID_HUELLA
            FROM SSCA.ADMS_HUELLAS
            WHERE SN_DISPOSITIVO = @pSN_DISPOSITIVO
              AND PIN = @pPIN
              AND FINGER_ID = @FINGER_ID;

            -- 2. Si NO existe, lo INSERTAMOS como un registro nuevo
            IF @ID_HUELLA IS NULL
            BEGIN
                INSERT INTO SSCA.ADMS_HUELLAS (
                    SN_DISPOSITIVO, PIN, FINGER_ID, TEMPLATE_BASE64, SIZE_BYTES, VALID,
                    FORMATO, MAJOR_VER, MINOR_VER, ORIGEN, USUARIO_CREACION, ACTIVO
                ) VALUES (
                    @pSN_DISPOSITIVO, @pPIN, @FINGER_ID, @TEMPLATE_BASE64, @SIZE_BYTES, @VALID,
                    @FORMATO, @MAJOR_VER, @MINOR_VER, @pORIGEN, @pUSUARIO, 1
                );

                INSERT INTO @Resultado (ACCION, FINGER_ID, ID_HUELLA)
                VALUES ('INSERT', @FINGER_ID, SCOPE_IDENTITY());
            END
            ELSE
            BEGIN
                -- 3. Si ya existe, ACTUALIZAMOS el registro (template, fechas, etc.)
                UPDATE SSCA.ADMS_HUELLAS
                SET TEMPLATE_BASE64 = @TEMPLATE_BASE64,
                    SIZE_BYTES = @SIZE_BYTES,
                    VALID = @VALID,
                    FORMATO = @FORMATO,
                    MAJOR_VER = @MAJOR_VER,
                    MINOR_VER = @MINOR_VER,
                    ORIGEN = @pORIGEN,
                    ACTIVO = 1,
                    FECHA_ACTUALIZACION = GETDATE()
                WHERE ID_HUELLA = @ID_HUELLA;

                INSERT INTO @Resultado (ACCION, FINGER_ID, ID_HUELLA)
                VALUES ('UPDATE', @FINGER_ID, @ID_HUELLA);
            END

            FETCH NEXT FROM huella_cursor INTO @FINGER_ID, @TEMPLATE_BASE64, @SIZE_BYTES, @VALID, @FORMATO, @MAJOR_VER, @MINOR_VER;
        END

        CLOSE huella_cursor;
        DEALLOCATE huella_cursor;

        COMMIT TRANSACTION;

        -- 4. Retornar un resumen de lo que se hizo
        SELECT
            SN_DISPOSITIVO = @pSN_DISPOSITIVO,
            PIN = @pPIN,
            TOTAL_HUELLAS_PROCESADAS = (SELECT COUNT(*) FROM @JSON_TABLE),
            INSERCIONES = SUM(CASE WHEN ACCION = 'INSERT' THEN 1 ELSE 0 END),
            ACTUALIZACIONES = SUM(CASE WHEN ACCION = 'UPDATE' THEN 1 ELSE 0 END),
            DETALLE = (
                SELECT ACCION, FINGER_ID, ID_HUELLA
                FROM @Resultado
                FOR JSON PATH
            )
        FROM @Resultado;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO


-- =============================================
-- SP: SSCA.SP_ADMS_FACIALES_UPSERT
-- Inserta o actualiza faciales por PIN
-- =============================================
USE [BK_RECURSOS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE SSCA.SP_ADMS_FACIALES_UPSERT
    @pSN_DISPOSITIVO        VARCHAR(50),
    @pPIN                   VARCHAR(20),
    @pJSON_FACIALES         NVARCHAR(MAX),      -- JSON con array de faciales
    @pORIGEN                VARCHAR(50) = 'DEVICE',
    @pUSUARIO               VARCHAR(50) = NULL,
    @pIP                    VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @JSON_TABLE TABLE (
        FACE_ID             INT,
        TEMPLATE_BASE64     NVARCHAR(MAX),
        SIZE_BYTES          INT,
        VALID               BIT,
        DURESS              BIT,
        TIPO_FACIAL         INT,
        FORMATO             INT,
        MAJOR_VER           INT,
        MINOR_VER           INT
    );
    
    DECLARE @Resultado TABLE (
        ACCION              VARCHAR(20),
        FACE_ID             INT,
        TIPO_FACIAL         INT,
        TEMPLATE_ANTERIOR   NVARCHAR(MAX),
        TEMPLATE_NUEVO      NVARCHAR(MAX)
    );
    
    -- Parsear JSON
    INSERT INTO @JSON_TABLE (
        FACE_ID, TEMPLATE_BASE64, SIZE_BYTES, 
        VALID, DURESS, TIPO_FACIAL, FORMATO, MAJOR_VER, MINOR_VER
    )
    SELECT 
        FACE_ID,
        TEMPLATE_BASE64,
        SIZE_BYTES,
        ISNULL(VALID, 1),
        ISNULL(DURESS, 0),
        TIPO_FACIAL,
        ISNULL(FORMATO, 0),
        ISNULL(MAJOR_VER, 39),
        ISNULL(MINOR_VER, 1)
    FROM OPENJSON(@pJSON_FACIALES)
    WITH (
        FACE_ID         INT             '$.face_id',
        TEMPLATE_BASE64 NVARCHAR(MAX)   '$.template_base64',
        SIZE_BYTES      INT             '$.size',
        VALID           BIT             '$.valid',
        DURESS          BIT             '$.duress',
        TIPO_FACIAL     INT             '$.tipo',
        FORMATO         INT             '$.formato',
        MAJOR_VER       INT             '$.major_ver',
        MINOR_VER       INT             '$.minor_ver'
    );
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Procesar cada facial
        DECLARE @FACE_ID INT, @TEMPLATE_BASE64 NVARCHAR(MAX), @SIZE_BYTES INT,
                @VALID BIT, @DURESS BIT, @TIPO_FACIAL INT, @FORMATO INT, 
                @MAJOR_VER INT, @MINOR_VER INT,
                @ID_FACIAL BIGINT, @TEMPLATE_ANTERIOR NVARCHAR(MAX);
        
        DECLARE facial_cursor CURSOR FOR
        SELECT FACE_ID, TEMPLATE_BASE64, SIZE_BYTES, VALID, DURESS, 
               TIPO_FACIAL, FORMATO, MAJOR_VER, MINOR_VER
        FROM @JSON_TABLE;
        
        OPEN facial_cursor;
        
        FETCH NEXT FROM facial_cursor INTO @FACE_ID, @TEMPLATE_BASE64, @SIZE_BYTES, 
                                          @VALID, @DURESS, @TIPO_FACIAL, 
                                          @FORMATO, @MAJOR_VER, @MINOR_VER;
        
        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- Verificar si existe
            SELECT @ID_FACIAL = ID_FACIAL,
                   @TEMPLATE_ANTERIOR = TEMPLATE_BASE64
            FROM SSCA.ADMS_FACIALES
            WHERE SN_DISPOSITIVO = @pSN_DISPOSITIVO
              AND PIN = @pPIN
              AND FACE_ID = @FACE_ID
              AND TIPO_FACIAL = @TIPO_FACIAL;
            
            -- Determinar descripción del tipo
            DECLARE @TIPO_DESCRIPCION VARCHAR(50) = 
                CASE @TIPO_FACIAL
                    WHEN 2 THEN 'INFRARROJO'
                    WHEN 9 THEN 'VISIBLE'
                    ELSE 'DESCONOCIDO'
                END;
            
            IF @ID_FACIAL IS NULL
            BEGIN
                -- INSERTAR NUEVO FACIAL
                INSERT INTO SSCA.ADMS_FACIALES (
                    SN_DISPOSITIVO, PIN, FACE_ID,
                    TEMPLATE_BASE64, SIZE_BYTES, VALID, DURESS,
                    TIPO_FACIAL, TIPO_DESCRIPCION,
                    FORMATO, MAJOR_VER, MINOR_VER,
                    ORIGEN, USUARIO_CREACION
                ) VALUES (
                    @pSN_DISPOSITIVO, @pPIN, @FACE_ID,
                    @TEMPLATE_BASE64, @SIZE_BYTES, @VALID, @DURESS,
                    @TIPO_FACIAL, @TIPO_DESCRIPCION,
                    @FORMATO, @MAJOR_VER, @MINOR_VER,
                    @pORIGEN, @pUSUARIO
                );
                
                SET @ID_FACIAL = SCOPE_IDENTITY();
                
                INSERT INTO @Resultado (ACCION, FACE_ID, TIPO_FACIAL, TEMPLATE_NUEVO)
                VALUES ('INSERT', @FACE_ID, @TIPO_FACIAL, @TEMPLATE_BASE64);
                
            END
            ELSE
            BEGIN
                -- VERIFICAR SI CAMBIÓ
                IF @TEMPLATE_ANTERIOR != @TEMPLATE_BASE64
                BEGIN
                    -- ACTUALIZAR FACIAL EXISTENTE
                    UPDATE SSCA.ADMS_FACIALES
                    SET TEMPLATE_BASE64 = @TEMPLATE_BASE64,
                        SIZE_BYTES = @SIZE_BYTES,
                        VALID = @VALID,
                        DURESS = @DURESS,
                        TIPO_DESCRIPCION = @TIPO_DESCRIPCION,
                        FORMATO = @FORMATO,
                        MAJOR_VER = @MAJOR_VER,
                        MINOR_VER = @MINOR_VER,
                        ORIGEN = @pORIGEN,
                        FECHA_ACTUALIZACION = GETDATE()
                    WHERE ID_FACIAL = @ID_FACIAL;
                    
                    INSERT INTO @Resultado (ACCION, FACE_ID, TIPO_FACIAL, TEMPLATE_ANTERIOR, TEMPLATE_NUEVO)
                    VALUES ('UPDATE', @FACE_ID, @TIPO_FACIAL, @TEMPLATE_ANTERIOR, @TEMPLATE_BASE64);
                    
                END
                ELSE
                BEGIN
                    INSERT INTO @Resultado (ACCION, FACE_ID, TIPO_FACIAL)
                    VALUES ('SIN CAMBIOS', @FACE_ID, @TIPO_FACIAL);
                END
            END
            
            FETCH NEXT FROM facial_cursor INTO @FACE_ID, @TEMPLATE_BASE64, @SIZE_BYTES, 
                                              @VALID, @DURESS, @TIPO_FACIAL, 
                                              @FORMATO, @MAJOR_VER, @MINOR_VER;
        END
        
        CLOSE facial_cursor;
        DEALLOCATE facial_cursor;
        
        COMMIT TRANSACTION;
        
        -- Retornar resultado
        SELECT 
            SN_DISPOSITIVO = @pSN_DISPOSITIVO,
            PIN = @pPIN,
            TOTAL_FACIALES = (SELECT COUNT(*) FROM SSCA.ADMS_FACIALES WHERE SN_DISPOSITIVO = @pSN_DISPOSITIVO AND PIN = @pPIN AND ACTIVO = 1),
            INSERCIONES = SUM(CASE WHEN ACCION = 'INSERT' THEN 1 ELSE 0 END),
            ACTUALIZACIONES = SUM(CASE WHEN ACCION = 'UPDATE' THEN 1 ELSE 0 END),
            SIN_CAMBIOS = SUM(CASE WHEN ACCION = 'SIN CAMBIOS' THEN 1 ELSE 0 END),
            DETALLE = (
                SELECT ACCION, FACE_ID, TIPO_FACIAL,
                       TEMPLATE_ANTERIOR, 
                       SUBSTRING(TEMPLATE_NUEVO, 1, 100) AS TEMPLATE_NUEVO_PREVIEW
                FROM @Resultado
                FOR JSON PATH
            )
        FROM @Resultado;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO



-- =============================================
-- SP: SSCA.SP_ADMS_HUELLAS_GET_BY_PIN
-- Obtiene todas las huellas de un PIN
-- =============================================
USE [BK_RECURSOS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE [SSCA].[SP_ADMS_HUELLAS_GET_BY_PIN]
    @pSN_DISPOSITIVO    VARCHAR(50) = NULL,
    @pPIN               VARCHAR(20),
    @pINCLUYE_TEMPLATES BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @pINCLUYE_TEMPLATES = 1
    BEGIN
        SELECT 
            ID_HUELLA,
            SN_DISPOSITIVO,
            PIN,
            FINGER_ID,
            TEMPLATE_BASE64,
            SIZE_BYTES,
            VALID,
            FORMATO,
            MAJOR_VER,
            MINOR_VER,
            ORIGEN,
            FECHA_RECIBIDO,
            FECHA_ACTUALIZACION,
            ACTIVO
        FROM SSCA.ADMS_HUELLAS
        WHERE PIN = @pPIN
          AND (@pSN_DISPOSITIVO IS NULL OR SN_DISPOSITIVO = @pSN_DISPOSITIVO)
        ORDER BY ACTIVO DESC, FINGER_ID;
    END
    ELSE
    BEGIN
        SELECT 
            ID_HUELLA,
            SN_DISPOSITIVO,
            PIN,
            FINGER_ID,
            CASE WHEN ACTIVO = 1 THEN '***TEMPLATE ACTIVO***' ELSE '***TEMPLATE INACTIVO***' END AS TEMPLATE_BASE64,
            SIZE_BYTES,
            VALID,
            FORMATO,
            MAJOR_VER,
            MINOR_VER,
            ORIGEN,
            FECHA_RECIBIDO,
            FECHA_ACTUALIZACION,
            ACTIVO
        FROM SSCA.ADMS_HUELLAS
        WHERE PIN = @pPIN
          AND (@pSN_DISPOSITIVO IS NULL OR SN_DISPOSITIVO = @pSN_DISPOSITIVO)
        ORDER BY ACTIVO DESC, FINGER_ID;
    END
END
GO

EXEC [SSCA].[SP_ADMS_HUELLAS_GET_BY_PIN] 'COVG215160125', '72698803'
EXEC [SSCA].[SP_ADMS_HUELLAS_GET_BY_PIN] 'COVG215160125', '71417705'


-- =============================================
-- SP: SSCA.SP_ADMS_FACIALES_GET_BY_PIN
-- Obtiene todos los faciales de un PIN
-- =============================================
USE [BK_RECURSOS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE [SSCA].[SP_ADMS_FACIALES_GET_BY_PIN]
    @pSN_DISPOSITIVO    VARCHAR(50) = NULL,
    @pPIN               VARCHAR(20),
    @pTIPO_FACIAL       INT = NULL,          -- NULL=todos, 2=IR, 9=Visible
    @pINCLUYE_TEMPLATES BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @pINCLUYE_TEMPLATES = 1
    BEGIN
        SELECT 
            ID_FACIAL,
            SN_DISPOSITIVO,
            PIN,
            FACE_ID,
            TEMPLATE_BASE64,
            SIZE_BYTES,
            VALID,
            DURESS,
            TIPO_FACIAL,
            TIPO_DESCRIPCION,
            FORMATO,
            MAJOR_VER,
            MINOR_VER,
            ORIGEN,
            FECHA_RECIBIDO,
            FECHA_ACTUALIZACION,
            ACTIVO
        FROM SSCA.ADMS_FACIALES
        WHERE PIN = @pPIN
          AND (@pSN_DISPOSITIVO IS NULL OR SN_DISPOSITIVO = @pSN_DISPOSITIVO)
          AND (@pTIPO_FACIAL IS NULL OR TIPO_FACIAL = @pTIPO_FACIAL)
          AND ACTIVO = 1
        ORDER BY TIPO_FACIAL, FACE_ID;
    END
    ELSE
    BEGIN
        SELECT 
            ID_FACIAL,
            SN_DISPOSITIVO,
            PIN,
            FACE_ID,
            '***TEMPLATE OCULTO***' AS TEMPLATE_BASE64,
            SIZE_BYTES,
            VALID,
            DURESS,
            TIPO_FACIAL,
            TIPO_DESCRIPCION,
            FORMATO,
            MAJOR_VER,
            MINOR_VER,
            ORIGEN,
            FECHA_RECIBIDO,
            FECHA_ACTUALIZACION,
            ACTIVO
        FROM SSCA.ADMS_FACIALES
        WHERE PIN = @pPIN
          AND (@pSN_DISPOSITIVO IS NULL OR SN_DISPOSITIVO = @pSN_DISPOSITIVO)
          AND (@pTIPO_FACIAL IS NULL OR TIPO_FACIAL = @pTIPO_FACIAL)
          AND ACTIVO = 1
        ORDER BY TIPO_FACIAL, FACE_ID;
    END
END
GO



-- =========================================================
-- [SSCA].[SP_SINCRONIZAR_ADMS_MARCACION_PERSONAL]
-- =========================================================
USE [BK_RECURSOS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE [SSCA].[SP_SINCRONIZAR_ADMS_MARCACION_PERSONAL]
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRAN;

        ------------------------------------------------------------
        -- 1. BLOQUEAR PARA EVITAR EJECUCIONES SIMULTÁNEAS
        ------------------------------------------------------------
        DECLARE @LockName NVARCHAR(255) = 'SSCA_SP_SINCRONIZAR_ADMS_MARCACION_PERSONAL';
        DECLARE @LockResult INT;
        
        EXEC @LockResult = sp_getapplock 
            @Resource = @LockName,
            @LockMode = 'Exclusive',
            @LockTimeout = 30000;
        
        IF @LockResult < 0
        BEGIN
            RAISERROR('No se pudo obtener el bloqueo para sincronización', 16, 1);
            RETURN;
        END

        ------------------------------------------------------------
        -- 2. OBTENER PERSONAL ACTIVO DE ADMS_PERSONAL
        ------------------------------------------------------------
        IF OBJECT_ID('tempdb..#tblPersonal') IS NOT NULL DROP TABLE #tblPersonal;

        CREATE TABLE #tblPersonal (
            CodObrero VARCHAR(20),
            DNI VARCHAR(20),
            Descripcion VARCHAR(200),
            CodSucursal VARCHAR(10),
            CodProyectoNoProd VARCHAR(20),
            CodIdentificador VARCHAR(20),
            NroEsquemaPlanilla VARCHAR(50),
            CodInsumo VARCHAR(50),
            Insumo VARCHAR(100),
            CodOcupacion VARCHAR(20),
            Ocupacion VARCHAR(200)
        );

        INSERT INTO #tblPersonal
        SELECT DISTINCT
            CodObrero,
            DNI,
            Descripcion,
            CodSucursal,
            CodProyectoNoProd,
            CodIdentificador,
            NroEsquemaPlanilla,
            CodInsumo,
            Insumo,
            CodOcupacion,
            Ocupacion
        FROM [SSCA].[ADMS_PERSONAL]
        WHERE Activo = 1;

        ------------------------------------------------------------
        -- 3. CREAR TABLA TEMPORAL PARA REGISTROS A PROCESAR
        ------------------------------------------------------------
        IF OBJECT_ID('tempdb..#RegistrosProcesar') IS NOT NULL DROP TABLE #RegistrosProcesar;

        CREATE TABLE #RegistrosProcesar (
            ID BIGINT,
            SN VARCHAR(50),
            PIN VARCHAR(20),
            FECHA_MARCACION DATE,
            HORA_MARCACION TIME,
            ESTADO INT,
            VERIF INT,
            TIPO_MARCACION INT,
            rn INT
        );

        WITH CTE AS (
            SELECT
                m.ID,
                m.SN,
                m.PIN,
                m.FECHA_MARCACION,
                m.HORA_MARCACION,
                m.ESTADO,
                m.VERIF,
                -- Clasificar el tipo de marcación según la hora
                CASE
                    WHEN m.HORA_MARCACION >= '05:00:00' AND m.HORA_MARCACION < '12:00:00' THEN 1  -- Entrada mañana
                    WHEN m.HORA_MARCACION >= '12:00:00' AND m.HORA_MARCACION < '13:30:00' THEN 2  -- Salida almuerzo
                    WHEN m.HORA_MARCACION >= '13:30:00' AND m.HORA_MARCACION < '16:00:00' THEN 3  -- Entrada tarde
                    WHEN m.HORA_MARCACION >= '16:00:00' THEN 4                                    -- Salida tarde
                    ELSE NULL
                END AS TIPO_MARCACION,
                ROW_NUMBER() OVER (
                    PARTITION BY
                        m.PIN,
                        m.FECHA_MARCACION,
                        CASE
                            WHEN m.HORA_MARCACION >= '05:00:00' AND m.HORA_MARCACION < '12:00:00' THEN 1
                            WHEN m.HORA_MARCACION >= '12:00:00' AND m.HORA_MARCACION < '13:30:00' THEN 2
                            WHEN m.HORA_MARCACION >= '13:30:00' AND m.HORA_MARCACION < '16:00:00' THEN 3
                            WHEN m.HORA_MARCACION >= '16:00:00' THEN 4
                        END
                    ORDER BY m.HORA_MARCACION
                ) AS rn
            FROM [SSCA].[ADMS_MARCACIONES] m WITH (UPDLOCK, HOLDLOCK)
            WHERE m.Procesado = 0
        )
        INSERT INTO #RegistrosProcesar
        SELECT 
            ID,
            SN,
            PIN,
            FECHA_MARCACION,
            HORA_MARCACION,
            ESTADO,
            VERIF,
            TIPO_MARCACION,
            rn
        FROM CTE
        WHERE rn = 1 AND TIPO_MARCACION IS NOT NULL;

        ------------------------------------------------------------
        -- 4. INSERTAR EN MARCACION_PERSONAL (con COLLATE en la comparación)
        ------------------------------------------------------------
        INSERT INTO [dbo].[MARCACION_PERSONAL] (
            ID_TAREADOR,
            PROYECTO,
            CODOBRERO,
            PERSONAL,
            DNI,
            SUBCONTRATA,
            TIPO_MARCACION,
            FECHA_MARCACION,
            HORA,
            FECHA_REGISTRO,
            SINCRONIZADO,
            FECHA_SINCRONIZADO,
            TOKEN,
            ID_SUCURSAL,
            ORIGEN,
            NroEsquemaPlanilla,
            CodInsumo,
            Insumo,
            CodOcupacion,
            Ocupacion
        )
        SELECT DISTINCT
            -- ID_TAREADOR
            ISNULL(p.CodIdentificador, 'SIN_TAREADOR'),
            
            -- PROYECTO
            ISNULL(p.CodProyectoNoProd, 'SIN_PROYECTO'),
            
            -- CODOBRERO
            ISNULL(p.CodObrero, 'SIN_CODIGO'),
            
            -- PERSONAL
            ISNULL(p.Descripcion, 'SIN_NOMBRE'),
            
            -- DNI (forzar collation a Modern_Spanish_CI_AS que es la de la tabla destino)
            CAST(m.PIN AS VARCHAR(20)) COLLATE Modern_Spanish_CI_AS,
            
            -- SUBCONTRATA
            0,
            
            -- TIPO_MARCACION
            m.TIPO_MARCACION,
            
            -- FECHA_MARCACION
            DATEADD(SECOND, 0, CAST(CONCAT(CONVERT(VARCHAR, m.FECHA_MARCACION, 23), ' ', CONVERT(VARCHAR, m.HORA_MARCACION, 108)) AS DATETIME)),
            
            -- HORA
            LEFT(CONVERT(VARCHAR(8), m.HORA_MARCACION, 108), 5),
            
            -- FECHA_REGISTRO
            GETDATE(),
            
            -- SINCRONIZADO
            0,
            
            -- FECHA_SINCRONIZADO
            GETDATE(),
            
            -- TOKEN
            NULL,
            
            -- ID_SUCURSAL
            ISNULL(p.CodSucursal, '000'),
            
            -- ORIGEN
            98,
            
            -- NroEsquemaPlanilla
            p.NroEsquemaPlanilla,
            
            -- CodInsumo
            p.CodInsumo,
            
            -- Insumo
            p.Insumo,
            
            -- CodOcupacion
            p.CodOcupacion,
            
            -- Ocupacion
            p.Ocupacion
            
        FROM #RegistrosProcesar m
        INNER JOIN #tblPersonal p
            ON p.DNI = m.PIN  -- Esta comparación es en tempdb, no hay problema
        WHERE NOT EXISTS (
            SELECT 1
            FROM [dbo].[MARCACION_PERSONAL] mp
            WHERE mp.DNI = CAST(m.PIN AS VARCHAR(20)) COLLATE Modern_Spanish_CI_AS
                AND CAST(mp.FECHA_MARCACION AS DATE) = m.FECHA_MARCACION
                AND mp.TIPO_MARCACION = m.TIPO_MARCACION
                AND mp.ORIGEN = 98
        );

        ------------------------------------------------------------
        -- 5. MARCAR COMO PROCESADAS LAS MARCACIONES UTILIZADAS
        ------------------------------------------------------------
        UPDATE m
        SET m.Procesado = 1,
            m.Fecha_Modificado = GETDATE()
        FROM [SSCA].[ADMS_MARCACIONES] m
        INNER JOIN #RegistrosProcesar r
            ON m.ID = r.ID
        WHERE m.Procesado = 0;

        ------------------------------------------------------------
        -- 6. LIBERAR BLOQUEO
        ------------------------------------------------------------
        EXEC sp_releaseapplock @Resource = @LockName;

        COMMIT;
        
        -- Mensaje de confirmación
        DECLARE @RegistrosProcesados INT = (SELECT COUNT(*) FROM #RegistrosProcesar);
        PRINT 'Sincronización completada. Registros procesados: ' + CAST(@RegistrosProcesados AS VARCHAR);
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        
        -- Liberar bloqueo en caso de error
        DECLARE @ErrorLockName NVARCHAR(255) = 'SSCA_SP_SINCRONIZAR_ADMS_MARCACION_PERSONAL';
        EXEC sp_releaseapplock @Resource = @ErrorLockName;
        
        -- Registrar error
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO




-- ===========================================================================================================================================================================
-- ===========================================================================================================================================================================
-- LOG - AUDITORIA
-- ===========================================================================================================================================================================
-- ===========================================================================================================================================================================


-- =============================================
-- TABLA 1: LOGS UNIVERSALES (Todas las acciones)
-- =============================================
USE [BK_RECURSOS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE SSCA.ADMS_LOG_UNIVERSAL (
    ID_LOG_UNIVERSAL    BIGINT IDENTITY(1,1) PRIMARY KEY,
    FECHA_HORA          DATETIME2 DEFAULT GETDATE(),
    TIPO_ACCION         VARCHAR(50),           -- 'API_CALL', 'COMANDO', 'MARCACION', 'HUELLA', 'FACIAL', 'ERROR', etc.
    CATEGORIA           VARCHAR(50),           -- 'SYSTEM', 'DEVICE', 'USER', 'ATTENDANCE', 'BIOMETRIC'
    NIVEL               VARCHAR(20),            -- 'INFO', 'WARNING', 'ERROR', 'DEBUG'
    
    -- Datos de la solicitud
    METODO_HTTP         VARCHAR(10),            -- GET, POST, PUT, DELETE
    ENDPOINT            VARCHAR(200),
    IP_ORIGEN           VARCHAR(50),
    USER_AGENT          VARCHAR(500),
    
    -- Datos del dispositivo
    SN_DISPOSITIVO      VARCHAR(50),
    MODELO_DISPOSITIVO  VARCHAR(100),
    
    -- Datos del usuario (quién ejecutó la acción)
    USUARIO_APP         VARCHAR(100),           -- usuario de la aplicación
    PIN_USUARIO         VARCHAR(50),            -- PIN del empleado afectado
    
    -- Descripción y datos
    DESCRIPCION         NVARCHAR(MAX),
    DATOS_ENVIADOS      NVARCHAR(MAX),          -- Request body/query
    DATOS_RECIBIDOS     NVARCHAR(MAX),          -- Response
    COMANDO_ENVIADO     NVARCHAR(MAX),          -- Comando al dispositivo
    RESULTADO           NVARCHAR(MAX),          -- Resultado de la operación
    
    -- Métricas
    TIEMPO_EJECUCION_MS INT,                    -- Tiempo de respuesta
    FILAS_AFECTADAS     INT,                    -- Para operaciones con BD
    CODIGO_RESPUESTA    INT,                     -- HTTP Status code
    
    -- Tracking
    SESSION_ID          VARCHAR(100),
    REQUEST_ID          VARCHAR(100),
    USUARIO_CREACION    VARCHAR(50) DEFAULT SYSTEM_USER
);

-- Índices para búsquedas rápidas
CREATE INDEX IX_ADMS_LOG_UNIVERSAL_FECHA ON SSCA.ADMS_LOG_UNIVERSAL(FECHA_HORA DESC);
CREATE INDEX IX_ADMS_LOG_UNIVERSAL_SN ON SSCA.ADMS_LOG_UNIVERSAL(SN_DISPOSITIVO);
CREATE INDEX IX_ADMS_LOG_UNIVERSAL_TIPO ON SSCA.ADMS_LOG_UNIVERSAL(TIPO_ACCION);
CREATE INDEX IX_ADMS_LOG_UNIVERSAL_CATEGORIA ON SSCA.ADMS_LOG_UNIVERSAL(CATEGORIA);
GO

-- =============================================
-- TABLA 2: LOGS DEL DISPOSITIVO (Comunicación directa)
-- =============================================
USE [BK_RECURSOS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE SSCA.ADMS_LOG_DISPOSITIVO (
    ID_LOG_DISPOSITIVO  BIGINT IDENTITY(1,1) PRIMARY KEY,
    FECHA_HORA          DATETIME2 DEFAULT GETDATE(),
    
    -- Identificación del dispositivo
    SN_DISPOSITIVO      VARCHAR(50) NOT NULL,
    MODELO              VARCHAR(100),
    FIRMWARE_VERSION    VARCHAR(50),
    IP_DISPOSITIVO      VARCHAR(50),
    
    -- Tipo de comunicación
    TIPO_COMUNICACION   VARCHAR(30),            -- 'GETREQUEST', 'CDATA', 'QUERYDATA', 'DEVICECMD'
    DIRECCION           VARCHAR(10),             -- 'IN' (dispositivo->servidor), 'OUT' (servidor->dispositivo)
    
    -- Datos de la comunicación
    METODO              VARCHAR(10),             -- GET, POST
    QUERY_PARAMS        NVARCHAR(MAX),
    BODY_RAW            NVARCHAR(MAX),
    BODY_PROCESADO      NVARCHAR(MAX),
    
    -- Tabla específica (para CDATA)
    TABLA_CDATA         VARCHAR(50),             -- ATTLOG, OPERLOG, BIODATA, USER
    LINEAS_PROCESADAS   INT,                     -- Cantidad de líneas procesadas
    REGISTROS_GUARDADOS INT,                     -- Cantidad de registros en BD
    
    -- Resultado
    RESPUESTA_ENVIADA   VARCHAR(50),             -- 'OK', 'ERROR', etc.
    CODIGO_ERROR        INT,
    MENSAJE_ERROR       NVARCHAR(MAX),
    
    -- Métricas
    TIEMPO_PROCESAMIENTO_MS INT,
    TAMANO_BYTES        INT,
    
    -- Tracking
    REQUEST_ID          VARCHAR(100),
    USUARIO_CREACION    VARCHAR(50) DEFAULT SYSTEM_USER
);

CREATE INDEX IX_ADMS_LOG_DISPOSITIVO_FECHA ON SSCA.ADMS_LOG_DISPOSITIVO(FECHA_HORA DESC);
CREATE INDEX IX_ADMS_LOG_DISPOSITIVO_SN ON SSCA.ADMS_LOG_DISPOSITIVO(SN_DISPOSITIVO);
CREATE INDEX IX_ADMS_LOG_DISPOSITIVO_TIPO ON SSCA.ADMS_LOG_DISPOSITIVO(TIPO_COMUNICACION);
GO



-- =============================================
-- TABLA 3: REGISTRO DE DISPOSITIVOS
-- =============================================
USE [BK_RECURSOS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE SSCA.ADMS_DISPOSITIVOS (
    ID_DISPOSITIVO      INT IDENTITY(1,1) PRIMARY KEY,
    
    -- Identificación única
    SN                  VARCHAR(50) NOT NULL UNIQUE,
    MODELO              VARCHAR(100),
    MARCA               VARCHAR(50) DEFAULT 'ZKTeco',
    NOMBRE              VARCHAR(100),
    
    -- Ubicación
    SUCURSAL            VARCHAR(50),
    SUCURSAL_DESCRIPCION VARCHAR(200),
    UBICACION_FISICA    VARCHAR(200),
    
    -- Configuración de red
    IP                  VARCHAR(50),
    PUERTO              INT DEFAULT 4370,
    MAC_ADDRESS         VARCHAR(20),
    
    -- Versiones
    FIRMWARE_VERSION    VARCHAR(50),
    PLATAFORMA          VARCHAR(50),             -- 'Linux', 'RTOS', etc.
    PROTOCOLO_VERSION   VARCHAR(20),
    
    -- Capacidades del dispositivo
    SOPORTA_HUELLA      BIT DEFAULT 1,
    SOPORTA_FACIAL      BIT DEFAULT 0,
    SOPORTA_PALMA       BIT DEFAULT 0,
    SOPORTA_TARJETA     BIT DEFAULT 1,
    SOPORTA_CODIGO      BIT DEFAULT 1,
    
    CAPACIDAD_USUARIOS  INT,
    CAPACIDAD_HUELLAS   INT,
    CAPACIDAD_FACIALES  INT,
    CAPACIDAD_REGISTROS INT,
    
    -- Estado actual
    ESTADO              VARCHAR(20) DEFAULT 'ACTIVO', -- 'ACTIVO', 'INACTIVO', 'MANTENIMIENTO'
    ONLINE              BIT DEFAULT 0,
    ULTIMA_CONEXION     DATETIME2,
    ULTIMA_IP           VARCHAR(50),
    ULTIMA_MARCACION    DATETIME2,
    
    -- Configuración
    ZONA_HORARIA        VARCHAR(10) DEFAULT '-0500',
    FORMATO_FECHA       INT DEFAULT 1,            -- 1: YYYY-MM-DD
    FORMATO_HORA        INT DEFAULT 1,            -- 1: 24h
    
    -- Datos de registro
    FECHA_REGISTRO      DATETIME2 DEFAULT GETDATE(),
    FECHA_ACTUALIZACION DATETIME2,
    USUARIO_REGISTRO    VARCHAR(50),
    USUARIO_ACTUALIZACION VARCHAR(50),
    
    -- Notas
    OBSERVACIONES       NVARCHAR(MAX),
    
    -- Control
    ACTIVO              BIT DEFAULT 1,
    FECHA_CREACION      DATETIME2 DEFAULT GETDATE(),
    USUARIO_CREACION    VARCHAR(50) DEFAULT SYSTEM_USER
);

CREATE INDEX IX_ADMS_DISPOSITIVOS_SN ON SSCA.ADMS_DISPOSITIVOS(SN);
CREATE INDEX IX_ADMS_DISPOSITIVOS_ESTADO ON SSCA.ADMS_DISPOSITIVOS(ESTADO);
CREATE INDEX IX_ADMS_DISPOSITIVOS_SUCURSAL ON SSCA.ADMS_DISPOSITIVOS(SUCURSAL);
GO


-- =============================================
-- TABLA 3-1: LISTAR DISPOSITIVOS
-- =============================================
USE [BK_RECURSOS];
GO
SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROC SSCA.SP_ADMS_DISPOSITIVOS_LISTAR
(
    @SN                 VARCHAR(50) = NULL,
    @SUCURSAL           VARCHAR(50) = NULL,
    @ESTADO             VARCHAR(20) = NULL,
    @ONLINE             BIT = NULL,
    @ACTIVO             BIT = 1
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        ID_DISPOSITIVO,
        
        -- Identificación
        SN,
        MODELO,
        MARCA,
        NOMBRE,
        
        -- Ubicación
        SUCURSAL,
        SUCURSAL_DESCRIPCION,
        UBICACION_FISICA,
        
        -- Red
        IP,
        PUERTO,
        MAC_ADDRESS,
        
        -- Versiones
        FIRMWARE_VERSION,
        PLATAFORMA,
        PROTOCOLO_VERSION,
        
        -- Capacidades
        SOPORTA_HUELLA,
        SOPORTA_FACIAL,
        SOPORTA_PALMA,
        SOPORTA_TARJETA,
        SOPORTA_CODIGO,
        
        CAPACIDAD_USUARIOS,
        CAPACIDAD_HUELLAS,
        CAPACIDAD_FACIALES,
        CAPACIDAD_REGISTROS,
        
        -- Estado
        ESTADO,
        ONLINE,
        ULTIMA_CONEXION,
        ULTIMA_IP,
        ULTIMA_MARCACION,
        
        -- Configuración
        ZONA_HORARIA,
        FORMATO_FECHA,
        FORMATO_HORA,
        
        -- Auditoría
        FECHA_REGISTRO,
        FECHA_ACTUALIZACION,
        USUARIO_REGISTRO,
        USUARIO_ACTUALIZACION,
        
        OBSERVACIONES,
        ACTIVO,
        FECHA_CREACION,
        USUARIO_CREACION

    FROM SSCA.ADMS_DISPOSITIVOS
    WHERE 
        (@SN IS NULL OR SN = @SN)
        AND (@SUCURSAL IS NULL OR SUCURSAL = @SUCURSAL)
        AND (@ESTADO IS NULL OR ESTADO = @ESTADO)
        AND (@ONLINE IS NULL OR ONLINE = @ONLINE)
        AND (@ACTIVO IS NULL OR ACTIVO = @ACTIVO)

    ORDER BY ID_DISPOSITIVO DESC;

END
GO



-- =============================================
-- TABLA 4: HISTORIAL DE ESTADO DE DISPOSITIVOS
-- =============================================
USE [BK_RECURSOS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE SSCA.ADMS_DISPOSITIVOS_HISTORIAL (
    ID_HISTORIAL        BIGINT IDENTITY(1,1) PRIMARY KEY,
    ID_DISPOSITIVO      INT,
    SN                  VARCHAR(50),
    FECHA_HORA          DATETIME2 DEFAULT GETDATE(),
    ESTADO_ANTERIOR     VARCHAR(20),
    ESTADO_NUEVO        VARCHAR(20),
    ONLINE_ANTERIOR     BIT,
    ONLINE_NUEVO        BIT,
    IP                  VARCHAR(50),
    MOTIVO              VARCHAR(200),
    OBSERVACIONES       NVARCHAR(MAX),
    USUARIO             VARCHAR(50) DEFAULT SYSTEM_USER
);

CREATE INDEX IX_ADMS_DISPOSITIVOS_HISTORIAL_SN ON SSCA.ADMS_DISPOSITIVOS_HISTORIAL(SN);
CREATE INDEX IX_ADMS_DISPOSITIVOS_HISTORIAL_FECHA ON SSCA.ADMS_DISPOSITIVOS_HISTORIAL(FECHA_HORA DESC);
GO



-- =============================================
-- STORE PROCEDURE 2: INSERTAR LOG DE DISPOSITIVO
-- =============================================
USE [BK_RECURSOS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE SSCA.SP_ADMS_LOG_DISPOSITIVO_INSERT
    @pSN_DISPOSITIVO        VARCHAR(50),
    @pMODELO                 VARCHAR(100) = NULL,
    @pFIRMWARE_VERSION       VARCHAR(50) = NULL,
    @pIP_DISPOSITIVO         VARCHAR(50) = NULL,
    @pTIPO_COMUNICACION      VARCHAR(30),
    @pDIRECCION              VARCHAR(10),
    @pMETODO                 VARCHAR(10) = NULL,
    @pQUERY_PARAMS           NVARCHAR(MAX) = NULL,
    @pBODY_RAW               NVARCHAR(MAX) = NULL,
    @pBODY_PROCESADO         NVARCHAR(MAX) = NULL,
    @pTABLA_CDATA            VARCHAR(50) = NULL,
    @pLINEAS_PROCESADAS      INT = NULL,
    @pREGISTROS_GUARDADOS    INT = NULL,
    @pRESPUESTA_ENVIADA      VARCHAR(50) = 'OK',
    @pCODIGO_ERROR           INT = NULL,
    @pMENSAJE_ERROR          NVARCHAR(MAX) = NULL,
    @pTIEMPO_PROCESAMIENTO_MS INT = NULL,
    @pTAMANO_BYTES           INT = NULL,
    @pREQUEST_ID             VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO SSCA.ADMS_LOG_DISPOSITIVO (
        SN_DISPOSITIVO, MODELO, FIRMWARE_VERSION, IP_DISPOSITIVO,
        TIPO_COMUNICACION, DIRECCION,
        METODO, QUERY_PARAMS, BODY_RAW, BODY_PROCESADO,
        TABLA_CDATA, LINEAS_PROCESADAS, REGISTROS_GUARDADOS,
        RESPUESTA_ENVIADA, CODIGO_ERROR, MENSAJE_ERROR,
        TIEMPO_PROCESAMIENTO_MS, TAMANO_BYTES,
        REQUEST_ID
    ) VALUES (
        @pSN_DISPOSITIVO, @pMODELO, @pFIRMWARE_VERSION, @pIP_DISPOSITIVO,
        @pTIPO_COMUNICACION, @pDIRECCION,
        @pMETODO, @pQUERY_PARAMS, @pBODY_RAW, @pBODY_PROCESADO,
        @pTABLA_CDATA, @pLINEAS_PROCESADAS, @pREGISTROS_GUARDADOS,
        @pRESPUESTA_ENVIADA, @pCODIGO_ERROR, @pMENSAJE_ERROR,
        @pTIEMPO_PROCESAMIENTO_MS, @pTAMANO_BYTES,
        @pREQUEST_ID
    );
    
    SELECT SCOPE_IDENTITY() AS ID_LOG_DISPOSITIVO;
END
GO



-- =============================================
-- STORE PROCEDURE: UPSERT LOG DE DISPOSITIVO (UNA FILA POR DISPOSITIVO)
-- =============================================
USE [BK_RECURSOS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE SSCA.SP_ADMS_LOG_DISPOSITIVO_UPSERT
    @pSN_DISPOSITIVO        VARCHAR(50),
    @pMODELO                 VARCHAR(100) = NULL,
    @pFIRMWARE_VERSION       VARCHAR(50) = NULL,
    @pIP_DISPOSITIVO         VARCHAR(50) = NULL,
    @pTIPO_COMUNICACION      VARCHAR(30),
    @pDIRECCION              VARCHAR(10),
    @pMETODO                 VARCHAR(10) = NULL,
    @pQUERY_PARAMS           NVARCHAR(MAX) = NULL,
    @pBODY_RAW               NVARCHAR(MAX) = NULL,
    @pBODY_PROCESADO         NVARCHAR(MAX) = NULL,
    @pTABLA_CDATA            VARCHAR(50) = NULL,
    @pLINEAS_PROCESADAS      INT = NULL,
    @pREGISTROS_GUARDADOS    INT = NULL,
    @pRESPUESTA_ENVIADA      VARCHAR(50) = 'OK',
    @pCODIGO_ERROR           INT = NULL,
    @pMENSAJE_ERROR          NVARCHAR(MAX) = NULL,
    @pTIEMPO_PROCESAMIENTO_MS INT = NULL,
    @pTAMANO_BYTES           INT = NULL,
    @pREQUEST_ID             VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO SSCA.ADMS_LOG_DISPOSITIVO (
        SN_DISPOSITIVO, MODELO, FIRMWARE_VERSION, IP_DISPOSITIVO,
        TIPO_COMUNICACION, DIRECCION,
        METODO, QUERY_PARAMS, BODY_RAW, BODY_PROCESADO,
        TABLA_CDATA, LINEAS_PROCESADAS, REGISTROS_GUARDADOS,
        RESPUESTA_ENVIADA, CODIGO_ERROR, MENSAJE_ERROR,
        TIEMPO_PROCESAMIENTO_MS, TAMANO_BYTES,
        REQUEST_ID
    ) VALUES (
        @pSN_DISPOSITIVO, @pMODELO, @pFIRMWARE_VERSION, @pIP_DISPOSITIVO,
        @pTIPO_COMUNICACION, @pDIRECCION,
        @pMETODO, @pQUERY_PARAMS, @pBODY_RAW, @pBODY_PROCESADO,
        @pTABLA_CDATA, @pLINEAS_PROCESADAS, @pREGISTROS_GUARDADOS,
        @pRESPUESTA_ENVIADA, @pCODIGO_ERROR, @pMENSAJE_ERROR,
        @pTIEMPO_PROCESAMIENTO_MS, @pTAMANO_BYTES,
        @pREQUEST_ID
    );

    SELECT SCOPE_IDENTITY() AS ID_LOG_DISPOSITIVO;

END
GO



-- =============================================
-- STORE PROCEDURE 3: REGISTRAR/ACTUALIZAR DISPOSITIVO
-- =============================================
USE [BK_RECURSOS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE SSCA.SP_ADMS_DISPOSITIVO_UPSERT
    @pSN                  VARCHAR(50),
    @pMODELO              VARCHAR(100) = NULL,
    @pMARCA               VARCHAR(50) = 'ZKTeco',
    @pNOMBRE              VARCHAR(100) = NULL,
    @pSUCURSAL            VARCHAR(50) = NULL,
    @pSUCURSAL_DESCRIPCION VARCHAR(200) = NULL,
    @pUBICACION_FISICA    VARCHAR(200) = NULL,
    @pIP                  VARCHAR(50) = NULL,
    @pPUERTO              INT = 4370,
    @pMAC_ADDRESS         VARCHAR(20) = NULL,
    @pFIRMWARE_VERSION    VARCHAR(50) = NULL,
    @pPLATAFORMA          VARCHAR(50) = NULL,
    @pPROTOCOLO_VERSION   VARCHAR(20) = NULL,
    @pSOPORTA_HUELLA      BIT = 1,
    @pSOPORTA_FACIAL      BIT = 0,
    @pSOPORTA_PALMA       BIT = 0,
    @pSOPORTA_TARJETA     BIT = 1,
    @pSOPORTA_CODIGO      BIT = 1,
    @pCAPACIDAD_USUARIOS  INT = NULL,
    @pCAPACIDAD_HUELLAS   INT = NULL,
    @pCAPACIDAD_FACIALES  INT = NULL,
    @pCAPACIDAD_REGISTROS INT = NULL,
    @pESTADO              VARCHAR(20) = 'ACTIVO',
    @pONLINE              BIT = 0,
    @pZONA_HORARIA        VARCHAR(10) = '-0500',
    @pFORMATO_FECHA       INT = 1,
    @pFORMATO_HORA        INT = 1,
    @pOBSERVACIONES       NVARCHAR(MAX) = NULL,
    @pUSUARIO             VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ID_DISPOSITIVO INT;
    DECLARE @ESTADO_ANTERIOR VARCHAR(20);
    DECLARE @ONLINE_ANTERIOR BIT;
    
    -- Verificar si existe
    SELECT @ID_DISPOSITIVO = ID_DISPOSITIVO,
           @ESTADO_ANTERIOR = ESTADO,
           @ONLINE_ANTERIOR = ONLINE
    FROM SSCA.ADMS_DISPOSITIVOS
    WHERE SN = @pSN;
    
    IF @ID_DISPOSITIVO IS NULL
    BEGIN
        -- Insertar nuevo
        INSERT INTO SSCA.ADMS_DISPOSITIVOS (
            SN, MODELO, MARCA, NOMBRE,
            SUCURSAL, SUCURSAL_DESCRIPCION, UBICACION_FISICA,
            IP, PUERTO, MAC_ADDRESS,
            FIRMWARE_VERSION, PLATAFORMA, PROTOCOLO_VERSION,
            SOPORTA_HUELLA, SOPORTA_FACIAL, SOPORTA_PALMA,
            SOPORTA_TARJETA, SOPORTA_CODIGO,
            CAPACIDAD_USUARIOS, CAPACIDAD_HUELLAS,
            CAPACIDAD_FACIALES, CAPACIDAD_REGISTROS,
            ESTADO, ONLINE, ULTIMA_CONEXION, ULTIMA_IP,
            ZONA_HORARIA, FORMATO_FECHA, FORMATO_HORA,
            OBSERVACIONES, USUARIO_REGISTRO
        ) VALUES (
            @pSN, @pMODELO, @pMARCA, @pNOMBRE,
            @pSUCURSAL, @pSUCURSAL_DESCRIPCION, @pUBICACION_FISICA,
            @pIP, @pPUERTO, @pMAC_ADDRESS,
            @pFIRMWARE_VERSION, @pPLATAFORMA, @pPROTOCOLO_VERSION,
            @pSOPORTA_HUELLA, @pSOPORTA_FACIAL, @pSOPORTA_PALMA,
            @pSOPORTA_TARJETA, @pSOPORTA_CODIGO,
            @pCAPACIDAD_USUARIOS, @pCAPACIDAD_HUELLAS,
            @pCAPACIDAD_FACIALES, @pCAPACIDAD_REGISTROS,
            @pESTADO, @pONLINE, 
            CASE WHEN @pONLINE = 1 THEN GETDATE() ELSE NULL END,
            @pIP,
            @pZONA_HORARIA, @pFORMATO_FECHA, @pFORMATO_HORA,
            @pOBSERVACIONES, @pUSUARIO
        );
        
        SET @ID_DISPOSITIVO = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        -- Actualizar existente
        UPDATE SSCA.ADMS_DISPOSITIVOS
        SET MODELO = ISNULL(@pMODELO, MODELO),
            MARCA = ISNULL(@pMARCA, MARCA),
            NOMBRE = ISNULL(@pNOMBRE, NOMBRE),
            SUCURSAL = ISNULL(@pSUCURSAL, SUCURSAL),
            SUCURSAL_DESCRIPCION = ISNULL(@pSUCURSAL_DESCRIPCION, SUCURSAL_DESCRIPCION),
            UBICACION_FISICA = ISNULL(@pUBICACION_FISICA, UBICACION_FISICA),
            IP = ISNULL(@pIP, IP),
            PUERTO = ISNULL(@pPUERTO, PUERTO),
            MAC_ADDRESS = ISNULL(@pMAC_ADDRESS, MAC_ADDRESS),
            FIRMWARE_VERSION = ISNULL(@pFIRMWARE_VERSION, FIRMWARE_VERSION),
            PLATAFORMA = ISNULL(@pPLATAFORMA, PLATAFORMA),
            PROTOCOLO_VERSION = ISNULL(@pPROTOCOLO_VERSION, PROTOCOLO_VERSION),
            SOPORTA_HUELLA = ISNULL(@pSOPORTA_HUELLA, SOPORTA_HUELLA),
            SOPORTA_FACIAL = ISNULL(@pSOPORTA_FACIAL, SOPORTA_FACIAL),
            SOPORTA_PALMA = ISNULL(@pSOPORTA_PALMA, SOPORTA_PALMA),
            SOPORTA_TARJETA = ISNULL(@pSOPORTA_TARJETA, SOPORTA_TARJETA),
            SOPORTA_CODIGO = ISNULL(@pSOPORTA_CODIGO, SOPORTA_CODIGO),
            CAPACIDAD_USUARIOS = ISNULL(@pCAPACIDAD_USUARIOS, CAPACIDAD_USUARIOS),
            CAPACIDAD_HUELLAS = ISNULL(@pCAPACIDAD_HUELLAS, CAPACIDAD_HUELLAS),
            CAPACIDAD_FACIALES = ISNULL(@pCAPACIDAD_FACIALES, CAPACIDAD_FACIALES),
            CAPACIDAD_REGISTROS = ISNULL(@pCAPACIDAD_REGISTROS, CAPACIDAD_REGISTROS),
            ESTADO = ISNULL(@pESTADO, ESTADO),
            ONLINE = ISNULL(@pONLINE, ONLINE),
            ULTIMA_CONEXION = CASE WHEN @pONLINE = 1 AND (ONLINE = 0 OR ONLINE IS NULL) 
                                    THEN GETDATE() 
                                    ELSE ULTIMA_CONEXION END,
            ULTIMA_IP = CASE WHEN @pIP IS NOT NULL AND @pIP != IP THEN @pIP ELSE ULTIMA_IP END,
            ZONA_HORARIA = ISNULL(@pZONA_HORARIA, ZONA_HORARIA),
            FORMATO_FECHA = ISNULL(@pFORMATO_FECHA, FORMATO_FECHA),
            FORMATO_HORA = ISNULL(@pFORMATO_HORA, FORMATO_HORA),
            OBSERVACIONES = ISNULL(@pOBSERVACIONES, OBSERVACIONES),
            FECHA_ACTUALIZACION = GETDATE(),
            USUARIO_ACTUALIZACION = @pUSUARIO
        WHERE ID_DISPOSITIVO = @ID_DISPOSITIVO;
    END
    
    -- Registrar cambio de estado en historial
    IF @pESTADO IS NOT NULL AND @ESTADO_ANTERIOR != @pESTADO
    BEGIN
        INSERT INTO SSCA.ADMS_DISPOSITIVOS_HISTORIAL (
            ID_DISPOSITIVO, SN, ESTADO_ANTERIOR, ESTADO_NUEVO,
            ONLINE_ANTERIOR, ONLINE_NUEVO, IP, MOTIVO, USUARIO
        ) VALUES (
            @ID_DISPOSITIVO, @pSN, @ESTADO_ANTERIOR, @pESTADO,
            @ONLINE_ANTERIOR, @pONLINE, @pIP, 'Cambio de estado', @pUSUARIO
        );
    END
    
    -- Retornar datos del dispositivo
    SELECT * FROM SSCA.ADMS_DISPOSITIVOS WHERE ID_DISPOSITIVO = @ID_DISPOSITIVO;
END
GO



-- =============================================
-- STORE PROCEDURE 4: ACTUALIZAR ÚLTIMA CONEXIÓN
-- =============================================
USE [BK_RECURSOS]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE SSCA.SP_ADMS_DISPOSITIVO_UPDATE_CONNECTION
    @pSN          VARCHAR(50),
    @pIP          VARCHAR(50) = NULL,
    @pONLINE      BIT = 1,
    @pFIRMWARE    VARCHAR(50) = NULL,
    @pMODELO      VARCHAR(100) = NULL,
    @pUSUARIO     VARCHAR(50) = NULL   -- NUEVO PARÁMETRO
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ID_DISPOSITIVO INT;
    DECLARE @ONLINE_ANTERIOR BIT;
    DECLARE @ESTADO_ANTERIOR VARCHAR(20);
    
    SELECT @ID_DISPOSITIVO = ID_DISPOSITIVO,
           @ONLINE_ANTERIOR = ONLINE,
           @ESTADO_ANTERIOR = ESTADO
    FROM SSCA.ADMS_DISPOSITIVOS
    WHERE SN = @pSN;
    
    IF @ID_DISPOSITIVO IS NOT NULL
    BEGIN
        UPDATE SSCA.ADMS_DISPOSITIVOS
        SET ONLINE = @pONLINE,
            ULTIMA_CONEXION = GETDATE(),
            ULTIMA_IP = ISNULL(@pIP, ULTIMA_IP),
            FIRMWARE_VERSION = ISNULL(@pFIRMWARE, FIRMWARE_VERSION),
            MODELO = ISNULL(@pMODELO, MODELO),
            USUARIO_ACTUALIZACION = ISNULL(@pUSUARIO, USUARIO_ACTUALIZACION) -- Actualizar usuario
        WHERE ID_DISPOSITIVO = @ID_DISPOSITIVO;
        
        -- Si cambió el estado online, registrar
        IF @ONLINE_ANTERIOR != @pONLINE
        BEGIN
            INSERT INTO SSCA.ADMS_DISPOSITIVOS_HISTORIAL (
                ID_DISPOSITIVO, SN, 
                ONLINE_ANTERIOR, ONLINE_NUEVO,
                IP, MOTIVO, USUARIO
            ) VALUES (
                @ID_DISPOSITIVO, @pSN,
                @ONLINE_ANTERIOR, @pONLINE,
                @pIP, 'Conexión actualizada', @pUSUARIO
            );
        END
    END
    ELSE
    BEGIN
        -- Insertar nuevo si no existe (con datos mínimos)
        EXEC SSCA.SP_ADMS_DISPOSITIVO_UPSERT
            @pSN = @pSN,
            @pMODELO = @pMODELO,
            @pIP = @pIP,
            @pONLINE = @pONLINE,
            @pFIRMWARE_VERSION = @pFIRMWARE,
            @pUSUARIO = @pUSUARIO;
    END
END
GO



























































































UPDATE CENTRO_COSTO SET COD_PROYECTO = '02909' WHERE ID_CENTRO_COSTO = '407'

SELECT * FROM [RECURSOS_HUMANOS].[dbo].PROYECTO_S10 WHERE CodProyecto = '02909'

SELECT * FROM CENTRO_COSTO WHERE ESTADO = 1 AND COD_PROYECTO IS NOT NULL

SELECT * FROM USUARIO_CENTROCOSTO WHERE ID_CENTRO_COSTO = '02872'

SELECT * FROM [RECURSOS_HUMANOS].[dbo].Listar_Personal_S10 WHERE CodProyectoNoProd = '02872'

SELECT * FROM USUARIO				WHERE USUARIO	= 'ctorres'

SELECT * FROM Listar_Personal_S10	WHERE CodObrero = '25844388'

SELECT * FROM CENTRO_COSTO WHERE ESTADO = 1

SELECT * FROM [RECURSOS_HUMANOS].[dbo].PROYECTO_S10 WHERE CodProyecto = '02909' 

SELECT * FROM [RECURSOS_HUMANOS].[dbo].PROYECTO_S10 WHERE CodProyecto = '16357'

EXEC [SSCA].[SP_PERSONAL_S10_LIST] @CodSucursal = '001', @CodProyectoNoProd = '02872', @IdTareador = NULL, @CodigoTrabajador = NULL

EXEC [SSCA].[SP_PERSONAL_S10_LIST] @CodSucursal = '001', @CodProyectoNoProd = '02909', @IdTareador = NULL, @CodigoTrabajador = NULL

EXEC [SSCA].[SP_PERSONAL_S10_LIST] @CodSucursal = '001', @CodProyectoNoProd = '16357', @IdTareador = NULL, @CodigoTrabajador = '00006395'

SELECT * FROM [RECURSOS_HUMANOS].[dbo].[Listar_Personal_S10] WHERE Descripcion LIKE '%jordan jo%'
SELECT * FROM [RECURSOS_HUMANOS].[dbo].[Listar_Personal_S10] WHERE DNI = '72311085'

SELECT * FROM [RECURSOS_HUMANOS].[dbo].[Listar_Personal_S10] WHERE CodIdentificador = '25844388' AND Activo = 1
SELECT * FROM [RECURSOS_HUMANOS].[dbo].[Listar_Personal_S10] WHERE CodObrero = '25844388' AND Activo = 1



SELECT DISTINCT P.*
FROM [RECURSOS_HUMANOS].[dbo].[Listar_Personal_S10] P
WHERE P.CodObrero = P.CodIdentificador
AND EXISTS (
    SELECT 1
    FROM [RECURSOS_HUMANOS].[dbo].[Listar_Personal_S10] H
    WHERE H.CodIdentificador = P.CodObrero
    AND H.CodObrero <> P.CodObrero
)
AND P.Activo = 1



SELECT 
    P.CodObrero,
    P.Descripcion,
    COUNT(H.CodObrero) AS CantidadTrabajadores
FROM [RECURSOS_HUMANOS].[dbo].[Listar_Personal_S10] P
INNER JOIN [RECURSOS_HUMANOS].[dbo].[Listar_Personal_S10] H
    ON H.CodIdentificador = P.CodObrero
    -- AND H.CodObrero <> P.CodObrero
WHERE P.CodObrero = P.CodIdentificador
AND P.Activo = 1 AND H.Activo = 1
GROUP BY P.CodObrero, P.Descripcion


EXEC [SSCA].[CENTRO_COSTO_ID_USUARIO] '161'







SELECT * FROM RECURSOS_HUMANOS.dbo.CENTRO_COSTO WHERE COD_PROYECTO = '02872'

SELECT * FROM RECURSOS_HUMANOS.dbo.CENTRO_COSTO WHERE COD_PROYECTO = '02909'


SELECT * FROM [RECURSOS_HUMANOS].[dbo].PROYECTO_S10 WHERE CodProyecto = '02872' 

SELECT * FROM [RECURSOS_HUMANOS].[dbo].PROYECTO_S10 WHERE CodProyecto = '02909' 

SELECT * FROM [RECURSOS_HUMANOS].[dbo].PROYECTO_S10 WHERE CodProyecto = '16357'



EXEC [SSCA].[SP_PERSONAL_S10_LIST] @CodSucursal = '001', @CodProyectoNoProd = '02909', @IdTareador = NULL, @CodigoTrabajador = NULL

EXEC [SSCA].[SP_PERSONAL_S10_LIST] @CodSucursal = '001', @CodProyectoNoProd = '16357', @IdTareador = NULL, @CodigoTrabajador = '00006395'



SELECT * FROM [RECURSOS_HUMANOS].[dbo].[Listar_Personal_S10] WHERE Descripcion LIKE '%jordan%'
SELECT * FROM [RECURSOS_HUMANOS].[dbo].[Listar_Personal_S10] WHERE DNI = '72311085'


SELECT * FROM [RECURSOS_HUMANOS].[dbo].[Listar_Personal_S10] WHERE DNI = '46520198'


SELECT * FROM [RECURSOS_HUMANOS].[dbo].[Listar_Personal_S10] WHERE DNI = '44366023'







SELECT [ID]
      ,[ID_TAREADOR]
      ,[PROYECTO]
      ,[CODOBRERO]
      ,[PERSONAL]
      ,[DNI]
      ,[SUBCONTRATA]
      ,[TIPO_MARCACION]
      ,[FECHA_MARCACION]
      ,[HORA]
      ,[FECHA_REGISTRO]
      ,[SINCRONIZADO]
      ,[FECHA_SINCRONIZADO]
      ,[TOKEN]
      ,[ID_SUCURSAL]
      ,[ORIGEN]
      ,[NroEsquemaPlanilla]
      ,[CodInsumo]
      ,[Insumo]
      ,[CodOcupacion]
      ,[Ocupacion]
FROM [BK_RECURSOS].[dbo].[MARCACION_PERSONAL]
ORDER BY fecha_registro DESC



SELECT * FROM [SSCA].[ADMS_MARCACIONES]


SELECT * FROM  RECURSOS_HUMANOS.dbo.Listar_Personal_S10 WHERE CodIdentificador = '00001286' AND Activo = 1

SELECT * FROM  RECURSOS_HUMANOS.dbo.Listar_Personal_S10 WHERE CodObrero = '00001286' AND Activo = 1

EXEC [SSCA].[SP_BIOTIME_PERSONAL_LIST] '001', '16386'





SELECT	 [id]
		,[codigo]
		,[nombre]
		,[dni]
		,[CodOcupacion]
		,[Ocupacion]
		,[NroEsquemaPlanilla]
		,[motivo]
		,[CodInsumo]
		,[Insumo]
		,[CodSucursal]
		,[CodIdentificador]
		,[CodProyecto]
		,[CodProyectoNoProd]
		,[ID_CENTRO_COSTO]
		,[DESCRIPCION]
		,[COLOQUIAL]
		,[DIRECCION]
		,[COD_PROYECTO]
		,[CODCENTROCOSTO]
		,[Activo]
		,[Sincronizado]
		,[usuario_registro]
		,[fecha_registro]
		,[usuario_modificado]
		,[fecha_modificado]
		,[payload]
FROM [BK_RECURSOS].[SSCA].[BIOTIME_PERSONAL]



          SELECT
            COD_PROYECTO,
            CODCENTROCOSTO,
            ID_CENTRO_COSTO,
            DESCRIPCION,
            COLOQUIAL,
            DIRECCION
        FROM [RECURSOS_HUMANOS].[dbo].[CENTRO_COSTO]
		WHERE COD_PROYECTO = '16386'





SELECT [ID_HUELLA]
      ,[SN_DISPOSITIVO]
      ,[PIN]
      ,[FINGER_ID]
      ,[TEMPLATE_BASE64]
      ,[SIZE_BYTES]
      ,[VALID]
      ,[FORMATO]
      ,[MAJOR_VER]
      ,[MINOR_VER]
      ,[FECHA_RECIBIDO]
      ,[FECHA_ACTUALIZACION]
      ,[ORIGEN]
      ,[ACTIVO]
      ,[USUARIO_CREACION]
      ,[FECHA_CREACION]
  FROM [BK_RECURSOS].[SSCA].[ADMS_HUELLAS]

  DELETE FROM [BK_RECURSOS].[SSCA].[ADMS_HUELLAS]
    DELETE FROM [BK_RECURSOS].[SSCA].[ADMS_HUELLAS_HISTORIAL]



  SELECT 
    ID_HUELLA,
    FINGER_ID,
    SUBSTRING(TEMPLATE_BASE64, 1, 50) as template_preview,
    SIZE_BYTES,
    ACTIVO
FROM SSCA.ADMS_HUELLAS 
WHERE PIN = '72698803'
ORDER BY FINGER_ID;









































































































































































































































-- =============================================
-- 1. TABLA [ADMS].[ADMS_GETREQUEST]
-- =============================================
IF OBJECT_ID('[ADMS].[ADMS_GETREQUEST]', 'U') IS NOT NULL
    DROP TABLE [ADMS].[ADMS_GETREQUEST];
GO

CREATE TABLE [ADMS].[ADMS_GETREQUEST] (
    id INT IDENTITY(1,1) PRIMARY KEY,
    fecha DATETIME2(7) NOT NULL,
    fechaLocal NVARCHAR(50) NOT NULL,
    serialNumber NVARCHAR(100) NOT NULL,
    ip NVARCHAR(100) NULL,
    deviceInfo NVARCHAR(MAX) NULL,
    tipo NVARCHAR(50) NULL
);
GO

INSERT INTO [ADMS].[ADMS_GETREQUEST]
(
    fecha,
    fechaLocal,
    serialNumber,
    ip,
    deviceInfo,
    tipo
)
VALUES
(
    GETDATE(),                        -- fecha actual del servidor
    FORMAT(GETDATE(), 'yyyy-MM-dd HH:mm:ss'), -- fechaLocal como string
    'SN-1234567890',                  -- serialNumber
    '192.168.1.100',                  -- ip del dispositivo
    N'{ "os": "Windows", "version": "10", "browser": "Chrome" }', -- deviceInfo en JSON
    'GET'                             -- tipo de request
);


-- =============================================
-- 2. TABLA [ADMS].[ADMS_CDATA] (ATTLOG)
-- =============================================
IF OBJECT_ID('[ADMS].[ADMS_CDATA]', 'U') IS NOT NULL
    DROP TABLE [ADMS].[ADMS_CDATA];
GO

CREATE TABLE [ADMS].[ADMS_CDATA] (
    id INT IDENTITY(1,1) PRIMARY KEY,   -- Identificador único
    PIN NVARCHAR(50) NOT NULL,          -- Usuario (PIN/ID del reloj)
    fechaHora DATETIME2(7) NOT NULL,    -- Fecha/Hora registrada en el dispositivo
    WorkCode NVARCHAR(50) NULL,         -- Código de trabajo
    VerifyMode NVARCHAR(50) NULL,       -- Tipo de verificación (0=PIN,1=Huella,2=Tarjeta,3=Rostro)
    InOutMode NVARCHAR(50) NULL,        -- Entrada/Salida (0=Entrada,1=Salida)
    Reserved1 NVARCHAR(50) NULL,        -- Reservado
    Reserved2 NVARCHAR(50) NULL,        -- Reservado
    Reserved3 NVARCHAR(50) NULL,        -- Reservado (suele venir 255)
    Reserved4 NVARCHAR(50) NULL,        -- Reservado
    Reserved5 NVARCHAR(50) NULL,        -- Reservado
    fechaLocal NVARCHAR(50) NOT NULL,   -- Hora local del servidor
    tipo NVARCHAR(50) NULL,             -- Tipo de dato (ATTLOG, USER, FACE, FP, etc.)
    Estado NVARCHAR(50) NULL            -- Estado del procesamiento (OK, ERROR, DUPLICADO)
);
GO

INSERT INTO [ADMS].[ADMS_CDATA]
(
    PIN,
    fechaHora,
    WorkCode,
    VerifyMode,
    InOutMode,
    Reserved1,
    Reserved2,
    Reserved3,
    Reserved4,
    Reserved5,
    fechaLocal,
    tipo,
    Estado
)
VALUES
(
    '12345',                         -- PIN
    '2025-09-25 08:30:00.0000000',   -- fechaHora
    '001',                           -- WorkCode
    '1',                             -- VerifyMode (ej. 1 = Huella)
    '0',                             -- InOutMode (0 = Entrada)
    NULL,                            -- Reserved1
    NULL,                            -- Reserved2
    '255',                           -- Reserved3
    NULL,                            -- Reserved4
    NULL,                            -- Reserved5
    '2025-09-25 08:30:00',           -- fechaLocal
    'ATTLOG',                        -- tipo
    'OK'                             -- Estado
);


-- =============================================
-- 3. Tabla de Usuarios (USERINFO/USER)
-- =============================================
IF OBJECT_ID('ADMS_USUARIOS', 'U') IS NOT NULL
    DROP TABLE ADMS_USUARIOS;
GO

CREATE TABLE ADMS_USUARIOS (
    id INT IDENTITY(1,1) PRIMARY KEY,
    fechaRegistro DATETIME2(7) NOT NULL,
    fechaLocal NVARCHAR(50) NOT NULL,
    PIN NVARCHAR(50) NOT NULL,
    Name NVARCHAR(150) NULL,
    Card NVARCHAR(100) NULL,
    Privilege NVARCHAR(50) NULL,
    Password NVARCHAR(100) NULL,
    GroupID NVARCHAR(50) NULL,
    TimeZones NVARCHAR(100) NULL
);
GO

-- =============================================
-- 4. Tabla de Huellas (FP)
-- =============================================
IF OBJECT_ID('ADMS_HUELLAS', 'U') IS NOT NULL
    DROP TABLE ADMS_HUELLAS;
GO

CREATE TABLE ADMS_HUELLAS (
    id INT IDENTITY(1,1) PRIMARY KEY,
    PIN NVARCHAR(50) NOT NULL,
    FP NVARCHAR(MAX) NOT NULL, -- JSON serializado
    fechaRegistro DATETIME2(7) NOT NULL,
    fechaLocal NVARCHAR(50) NOT NULL
);
GO

-- =============================================
-- 5. Tabla de Rostros (FACE)
-- =============================================
IF OBJECT_ID('ADMS_ROSTROS', 'U') IS NOT NULL
    DROP TABLE ADMS_ROSTROS;
GO

CREATE TABLE ADMS_ROSTROS (
    id INT IDENTITY(1,1) PRIMARY KEY,
    PIN NVARCHAR(50) NOT NULL,
    FACE NVARCHAR(MAX) NOT NULL, -- JSON serializado
    fechaRegistro DATETIME2(7) NOT NULL,
    fechaLocal NVARCHAR(50) NOT NULL
);
GO



SELECT * FROM [ADMS].[ADMS_GETREQUEST];
SELECT * FROM [ADMS].[ADMS_CDATA];
SELECT * FROM ADMS_USUARIOS;
SELECT * FROM ADMS_HUELLAS;
SELECT * FROM ADMS_ROSTROS;

-- DELETE [ADMS].[ADMS_GETREQUEST];
-- DELETE FROM ADMS_ASISTENCIAS;
-- DELETE FROM ADMS_USUARIOS;
-- DELETE FROM ADMS_HUELLAS;
-- DELETE FROM ADMS_ROSTROS;

-- DROP TABLE [ADMS].[ADMS_GETREQUEST];
-- DROP TABLE ADMS_ASISTENCIAS;
-- DROP TABLE ADMS_USUARIOS;
-- DROP TABLE ADMS_HUELLAS;
-- DROP TABLE ADMS_ROSTROS;
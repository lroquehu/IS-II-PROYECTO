let nivelEstudiantesChart;
let categoriaCursosChart;
let estudiantesPorCursoChart;

let nextIds = {estudiantes: 1, docentes: 1, cursos: 1};

let editingInfo = {tipo: null, id: null};

// Estado de la aplicación
const state = {
    estudiantes: [],
    docentes: [],
    cursos: [],
    actividades: []
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    
    initializeDataTable();
    initializeDataTableDocente();
    initializeDataTableCurso();
    
    updateCounters();
    updateCharts();
    initEventListeners();

    loadTheme();
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
});


const registrarBtn = document.getElementById('registrar');
const registrarBtnDocente = document.getElementById('registrarDocente');
const registrarBtnCurso = document.getElementById('registrarCurso');
const input = document.getElementById('imagenPerfil');
const preview = document.getElementById('previewImagenPerfil');



// Funciones auxiliares
function updateStateFromTable(type) {

    const tableId = type === 'docentes' ? '#tablaDinamicaDocente' : 
    type === 'cursos' ? '#tablaDinamicaCurso' : '#tablaDinamica';

    if ($.fn.DataTable.isDataTable(tableId)) {
        const table = $(tableId).DataTable();
        state[type] = table.rows().data().map(row => ({
            id: parseInt(row[0]),
            nombre: row[1],
            dni: row[2],
            fecha_nacimiento: row[3],
            direccion: row[4],
            contacto: row[5],
            curso: row[6],
            nivel: row[7],
            horario: row[8],
            estado: row[9]
        })).toArray();
    }
}

// FUNCIÓN updateCharts 
function updateCharts() {
    // 1. Distribución por niveles 
    const niveles = { Principiante: 0, Intermedio: 0, Avanzado: 0 };
    const estudiantesPorCurso = {};
    
    // Verificar SI EXISTE la tabla de estudiantes
    if ($.fn.DataTable.isDataTable('#tablaDinamica')) {
        const studentTable = $('#tablaDinamica').DataTable();
        const studentRows = studentTable.rows().data().toArray();
        
        studentRows.forEach(row => {
            const nivel = row[7];
            const curso = row[6];
            
            // Contar niveles
            if (nivel) niveles[nivel]++;
            
            // Contar cursos (dinámico)
            if (curso) {
                if (!estudiantesPorCurso[curso]) {
                    estudiantesPorCurso[curso] = 0;
                }
                estudiantesPorCurso[curso]++;
            }
        });
    }

    // 2. Actualizar gráfica de niveles
    if (nivelEstudiantesChart) {
        nivelEstudiantesChart.data.datasets[0].data = Object.values(niveles);
        nivelEstudiantesChart.update();
    }

    // 3. Actualizar gráfica de estudiantes por curso (CORREGIDO)
    if (estudiantesPorCursoChart) {
        // Actualizar etiquetas Y datos
        estudiantesPorCursoChart.data.labels = Object.keys(estudiantesPorCurso);
        estudiantesPorCursoChart.data.datasets[0].data = Object.values(estudiantesPorCurso);
        estudiantesPorCursoChart.update();
    }

    // 4. Cursos por categoría

    const cursosPorCategoria = {};
    
    // Verificar SI EXISTE la tabla de cursos
    if ($.fn.DataTable.isDataTable('#tablaDinamicaCurso')) {
        const courseTable = $('#tablaDinamicaCurso').DataTable();
        const courseRows = courseTable.rows().data().toArray();
        
        courseRows.forEach(row => {
            const categoria = row[1];
            if (categoria) {
                if (!cursosPorCategoria[categoria]) {
                    cursosPorCategoria[categoria] = 0;
                }
                cursosPorCategoria[categoria]++;
            }
        });
    }

    // 5. Actualizar gráfica de cursos
    if (categoriaCursosChart) {
        // Actualizar etiquetas Y datos
        categoriaCursosChart.data.labels = Object.keys(cursosPorCategoria);
        categoriaCursosChart.data.datasets[0].data = Object.values(cursosPorCategoria);
        categoriaCursosChart.update();
    }
}

function initializeDataTable() {
    if ($.fn.DataTable.isDataTable('#tablaDinamica')) $('#tablaDinamica').DataTable().destroy();
    
    $('#tablaDinamica').DataTable({
        dom: 'Blfrtip',
        buttons: [
            {
                extend: "excelHtml5",
                text: "<i class='fa-solid fa-file-excel'></i>",
                titleAttr: "Exportar a Excel",
                className: "btn btn-success",
                exportOptions: {
                    columns: [0,1,2,3,4,5,6,7,8,9]
                }
            },
            {
                extend: "pdfHtml5",
                text: "<i class='fa-solid fa-file-pdf'></i>",
                titleAttr: "Esportar a PDF",
                className: "btn btn-danger",
                exportOptions: {
                    columns: [0,1,2,3,4,5,6,7,8,9]
                }
            },
            {
                extend: "print",
                text: "<i class='fa-solid fa-print'></i>",
                titleAttr: "Imprimir",
                className: "btn btn-info",
                exportOptions: {
                    columns: [0,1,2,3,4,5,6,7,8,9]
                },
            }, 
        ],
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json"
        },
        lengthMenu: [3, 6, 9, 12],
        columnDefs: [
            { orderable: false, targets: [10] }, 
            { searchable: false, targets: [10] },
            {width: "10%", targets: [5]},
            {targets: -1},
            {data: null},
        ], 
        pageLength: 5,
    });
}

registrarBtn.addEventListener('click', function () {
    const nombre = document.getElementById('nombre').value;
    const dni = document.getElementById('dni').value;
    const fecha_nacimiento = document.getElementById('fecha_nacimiento').value;
    const direccion = document.getElementById('direccion').value;
    const contacto = document.getElementById('contacto').value;
    const curso = document.getElementById('curso').value;
    const nivel = document.getElementById('nivel').value;
    const horario = document.getElementById('horario').value;
    const estado = document.getElementById('estado').value;
    
    if (nombre && dni && fecha_nacimiento && direccion && contacto && curso && nivel && horario && estado) {
        const table = $('#tablaDinamica').DataTable();
        if (editingInfo.tipo === 'estudiante' && editingInfo.id !== null) {
            // Actualizar estudiante existente
            table.rows().every(function() {
                const data = this.data();
                if (parseInt(data[0]) === editingInfo.id) {
                    this.data([editingInfo.id, nombre, dni, fecha_nacimiento, direccion,contacto, curso,nivel,horario, estado,
                        '<button class="btn btn-warning btn-edit"><i class="fa-solid fa-pencil "></i></button> <button class="btn btn-danger btn-delete"><i class="fa-solid fa-trash-can"></i></button>'
                    ]);
                }
            });
        } else {
            table.row.add([nextIds.estudiantes++, nombre, dni, fecha_nacimiento, direccion,contacto, curso,nivel,horario, estado,
                '<button class="btn btn-warning btn-edit"><i class="fa-solid fa-pencil "></i></button> <button class="btn btn-danger btn-delete"><i class="fa-solid fa-trash-can"></i></button>']).draw();
        }

        document.getElementById('nombre').value = '';
        document.getElementById('dni').value = '';
        document.getElementById('fecha_nacimiento').value = '';
        document.getElementById('direccion').value = '';
        document.getElementById('contacto').value = '';
        document.getElementById('curso').value = '';
        document.getElementById('nivel').value = '';
        document.getElementById('horario').value = '';
        document.getElementById('estado').value = '';

        // Resetear estado
        editingInfo = { tipo: null, id: null };
        $('#registrar').text('Registrar Estudiante');

    } else {
        alert("Por favor, complete todos los campos antes de registrar.");
    }
    
    updateAll();
});

$('#tablaDinamica').on('click', '.btn-edit', function () {
    const row = $(this).closest('tr');
    const data = $('#tablaDinamica').DataTable().row(row).data();
    editingInfo = { tipo: 'estudiante', id: parseInt(data[0]) };
    document.getElementById('nombre').value = data[1];
    document.getElementById('dni').value = data[2];
    document.getElementById('fecha_nacimiento').value = data[3];
    document.getElementById('direccion').value = data[4];
    document.getElementById('contacto').value = data[5];
    document.getElementById('curso').value = data[6];
    document.getElementById('nivel').value = data[7];
    document.getElementById('horario').value = data[8];
    document.getElementById('estado').value = data[9];
    $('#registrar').text('Actualizar');
    updateAll();
});
$('#tablaDinamica').on('click', '.btn-delete', function () {
    const row = $(this).closest('tr');
    $('#tablaDinamica').DataTable().row(row).remove().draw();
    updateAll();
});

function initializeDataTableDocente() {
    if ($.fn.DataTable.isDataTable('#tablaDinamicaDocente')) {
        $('#tablaDinamicaDocente').DataTable().destroy();
    }

    $('#tablaDinamicaDocente').DataTable({
        dom: 'Blfrtip',
        buttons: [
            {
                extend: "excelHtml5",
                text: "<i class='fas fa-file-excel'></i>",
                titleAttr: "Exportar a Excel",
                className: "btn btn-success",
                exportOptions: {
                    columns: [0,1,2,3,4,5,6,7,8,9]
                }
            },
            {
                extend: "pdfHtml5",
                text: "<i class='fa-solid fa-file-pdf'></i>",
                titleAttr: "Exportar a PDF",
                className: "btn btn-danger",
                exportOptions: {
                    columns: [0,1,2,3,4,5,6,7,8,9]
                }
            },
            {
                extend: "print",
                text: "<i class='fa-solid fa-print'></i>",
                titleAttr: "Imprimir",
                className: "btn btn-info",
                exportOptions: {
                    columns: [0,1,2,3,4,5,6,7,8,9]
                }
            }
        ],
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json"
        },
        lengthMenu: [3, 6, 9, 12],
        columnDefs: [
            { orderable: false, targets: [-1,0,1,2,3,4,5,6,7,8,9,10]}, // Deshabilitar ordenación en la última columna (Acciones)
            { searchable: false, targets: -1 }, // Deshabilitar búsqueda en la última columna
            {width: "10%", target: [6]}
        ],
        pageLength: 5,
    });
}

registrarBtnDocente.addEventListener('click', function () {
    const nombre = document.getElementById('nombreDocente').value;
    const dni = document.getElementById('dniDocente').value;
    const fechaNac = document.getElementById('fechaNacDocente').value;
    const especialidad = document.getElementById('especialidadDocente').value;
    const grado = document.getElementById('gradoDocente').value;
    const experiencia = document.getElementById('experienciaDocente').value;
    const horario = document.getElementById('horarioDocente').value;
    const contacto = document.getElementById('contactoDocente').value;
    const salario = document.getElementById('salarioDocente').value;

    if (nombre && dni && fechaNac && especialidad && grado && experiencia && horario && contacto && salario) {
        const table = $('#tablaDinamicaDocente').DataTable();
        if (editingInfo.tipo === 'docente' && editingInfo.id !== null) {
            // Actualizar la fila por ID
            table.rows().every(function (rowIdx, tableLoop, rowLoop) {
                const data = this.data();
                if (parseInt(data[0]) === editingInfo.id) {
                    this.data([
                        editingInfo.id, nombre, dni, fechaNac, especialidad, grado, experiencia, horario, contacto, salario,
                        '<button class="btn btn-warning btn-edit"><i class="fa-solid fa-pencil"></i></button> <button class="btn btn-danger btn-delete"><i class="fa-solid fa-trash-can"></i></button>'
                    ]);
                }
            });
        } else {
            table.row.add([
                nextIds.docentes++, nombre, dni, fechaNac, especialidad, grado, experiencia, horario, contacto, salario,
                '<button class="btn btn-warning btn-edit"><i class="fa-solid fa-pencil"></i></button> <button class="btn btn-danger btn-delete"><i class="fa-solid fa-trash-can"></i></button>'
            ]).draw();
        }

        document.getElementById('nombreDocente').value = '';      
        document.getElementById('dniDocente').value = '';
        document.getElementById('fechaNacDocente').value = '';
        document.getElementById('especialidadDocente').value = '';
        document.getElementById('gradoDocente').value = '';
        document.getElementById('experienciaDocente').value = '';
        document.getElementById('horarioDocente').value = '';
        document.getElementById('contactoDocente').value = '';
        document.getElementById('salarioDocente').value = '';
        editingInfo = { tipo: null, id: null };
        $('#registrarDocente').text('Registrar Docente');

    } else {
        alert("Por favor, complete todos los campos antes de registrar.");
    }
    updateAll();
});

$('#tablaDinamicaDocente').on('click', '.btn-edit', function () {
    const row = $(this).closest('tr');
    const data = $('#tablaDinamicaDocente').DataTable().row(row).data();
    editingInfo = { tipo: 'docente', id: parseInt(data[0]) };
    document.getElementById('nombreDocente').value = data[1];
    document.getElementById('dniDocente').value = data[2];
    document.getElementById('fechaNacDocente').value = data[3];
    document.getElementById('especialidadDocente').value = data[4];
    document.getElementById('gradoDocente').value = data[5];
    document.getElementById('experienciaDocente').value = data[6];
    document.getElementById('horarioDocente').value = data[7];
    document.getElementById('contactoDocente').value = data[8];
    document.getElementById('salarioDocente').value = data[9];
    $('#registrarDocente').text('Actualizar');
    updateAll();
});
$('#tablaDinamicaDocente').on('click', '.btn-delete', function () {
    const row = $(this).closest('tr');
    $('#tablaDinamicaDocente').DataTable().row(row).remove().draw();
    updateAll();
});

function initializeDataTableCurso() {
    if ($.fn.DataTable.isDataTable('#tablaDinamicaCurso')) {
        $('#tablaDinamicaCurso').DataTable().destroy();
    }

    $('#tablaDinamicaCurso').DataTable({
        dom: 'Blfrtip',
        buttons: [
            {
                extend: "excelHtml5",
                text: "<i class='fa-solid fa-file-excel'></i>",
                titleAttr: "Exportar a Excel",
                className: "btn btn-success",
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
                }
            },
            {
                extend: "pdfHtml5",
                text: "<i class='fa-solid fa-file-pdf'></i>",
                titleAttr: "Esportar a PDF",
                className: "btn btn-danger",
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
                }
            },
            {
                extend: "print",
                text: "<i class='fa-solid fa-print'></i>",
                titleAttr: "Imprimir",
                className: "btn btn-info",
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
                }
            }
        ],
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json"
        },
        lengthMenu: [3, 6, 9, 12],
        columnDefs: [
            { orderable: false, targets: [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
            { searchable: false, targets: -1 },
            { width: "1%", targets: [5] },
            { targets: -1 },
            { data: null }
        ],
        pageLength: 5
    });
};

registrarBtnCurso.addEventListener('click', function () {
    const nombreCurso = document.getElementById('nombreCurso').value;
    const descripcionCurso = document.getElementById('descripcionCurso').value;
    const duracionCurso = document.getElementById('duracionCurso').value;
    const nivelCurso = document.getElementById('nivelCurso').value;
    const horarioCurso = document.getElementById('horarioCurso').value;
    const docenteCurso = document.getElementById('docenteCurso').value;
    const numPlazaCurso = document.getElementById('numPlazaCurso').value;
    const costoCurso = document.getElementById('costoCurso').value;
    const materialCurso = document.getElementById('materialCurso').value;
    if (nombreCurso && descripcionCurso && duracionCurso && nivelCurso && horarioCurso && docenteCurso && numPlazaCurso && costoCurso && materialCurso) {
        const table = $('#tablaDinamicaCurso').DataTable();
        if (editingInfo.tipo === 'curso' && editingInfo.id !== null) {
            // Actualizar la fila por ID
            table.rows().every(function (rowIdx, tableLoop, rowLoop) {
                const data = this.data();
                if (parseInt(data[0]) === editingInfo.id) {
                    this.data([editingInfo.id, nombreCurso, descripcionCurso, duracionCurso, nivelCurso, horarioCurso, docenteCurso, numPlazaCurso, costoCurso, materialCurso, 
                    '<button class="btn btn-warning btn-edit"><i class="fa-solid fa-pencil "></i></button> <button class="btn btn-danger btn-delete"><i class="fa-solid fa-trash-can"></i></button>']);
                }
            });
        } else {
            table.row.add([nextIds.cursos++, nombreCurso, descripcionCurso, duracionCurso, nivelCurso, horarioCurso, docenteCurso, numPlazaCurso, costoCurso, materialCurso,  
            '<button class="btn btn-warning btn-edit"><i class="fa-solid fa-pencil "></i></button> <button class="btn btn-danger btn-delete"><i class="fa-solid fa-trash-can"></i></button>']).draw();
        }
        document.getElementById('nombreCurso').value = '';
        document.getElementById('descripcionCurso').value = '';
        document.getElementById('duracionCurso').value = '';
        document.getElementById('nivelCurso').value = '';
        document.getElementById('horarioCurso').value = '';
        document.getElementById('docenteCurso').value = '';
        document.getElementById('numPlazaCurso').value = '';
        document.getElementById('costoCurso').value = '';
        document.getElementById('materialCurso').value = '';
        editingInfo = { tipo: null, id: null };
        $('#registrarCurso').text('Registrar Curso');
    } else {
        alert('Por favor, complete todos los campos antes de registrar.');
    }
    updateAll();
});

$('#tablaDinamicaCurso').on('click', '.btn-edit', function () {
    const row = $(this).closest('tr');
    const data = $('#tablaDinamicaCurso').DataTable().row(row).data();
    editingInfo = { tipo: 'curso', id: parseInt(data[0]) };
    document.getElementById('nombreCurso').value = data[1];
    document.getElementById('descripcionCurso').value = data[2];
    document.getElementById('duracionCurso').value = data[3];
    document.getElementById('nivelCurso').value = data[4];
    document.getElementById('horarioCurso').value = data[5];
    document.getElementById('docenteCurso').value = data[6];
    document.getElementById('numPlazaCurso').value = data[7];
    document.getElementById('costoCurso').value = data[8];
    document.getElementById('materialCurso').value = data[9];
    $('#registrarCurso').text('Actualizar');
    updateAll();
});
$('#tablaDinamicaCurso').on('click', '.btn-delete', function () {
    const row = $(this).closest('tr');
    $('#tablaDinamicaCurso').DataTable().row(row).remove().draw();
    updateAll();
});

function initEventListeners() {
    // Event listener para logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('loggedIn');
        window.location.href = 'index.html';
    });

    // Event listeners para menú
    document.querySelectorAll('.sidebar a').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelectorAll('.sidebar a').forEach(el => el.classList.remove('formImagen'));
            this.classList.add('active');
        });
    });
}

function updateCounters() {
    let totalEst = 0;
    if ($.fn.DataTable.isDataTable('#tablaDinamica')) {
        totalEst = $('#tablaDinamica').DataTable().rows().count();
    }
    document.getElementById('total-estudiantes').textContent = totalEst;

    let totalDoc = 0;
    if ($.fn.DataTable.isDataTable('#tablaDinamicaDocente')) {
        totalDoc = $('#tablaDinamicaDocente').DataTable().rows().count();
    }
    document.getElementById('total-docentes').textContent = totalDoc;

    let totalCur = 0;
    if ($.fn.DataTable.isDataTable('#tablaDinamicaCurso')) {
        totalCur = $('#tablaDinamicaCurso').DataTable().rows().count();
    }
    document.getElementById('total-cursos').textContent = totalCur;
}


function toggleVisibility(mainOption, subOption, title) {
    // Ocultar todas las secciones
    document.querySelectorAll('.suboption-panel > div').forEach(div => {
        div.style.display = 'none';
    });
    
    // Mostrar la sección seleccionada
    if (mainOption) {
        const section = document.querySelector(`.${mainOption.toLowerCase()}`);
        if (section) section.style.display = 'block';
    }
    
    if (subOption) {
        const section = document.querySelector(`.gestion-${subOption}`);
        if (section) section.style.display = 'block';
    }
    
    // Actualizar título
    if (title) document.querySelector('.navbar-brand').innerHTML = `${title}`;

    // Inicializar DataTables solo cuando se muestra la sección
    if (subOption === 'estudiante') {
        initializeDataTable();
    } else if (subOption === 'docente') {
        initializeDataTableDocente();
    } else if (subOption === 'curso') {
        initializeDataTableCurso();
    }
    
    // Reiniciar estado de edición al cambiar de sección
    editingInfo = { tipo: null, id: null };
    
    // Restaurar texto de botones
    document.querySelectorAll('#registrar, #registrarDocente, #registrarCurso')
    .forEach(btn => {
        if (btn.id === 'registrar') btn.textContent = 'Registrar Estudiante';
        if (btn.id === 'registrarDocente') btn.textContent = 'Registrar Docente';
        if (btn.id === 'registrarCurso') btn.textContent = 'Registrar Curso';
    });

    if (mainOption === 'dashboard') updateAll();
}

function initCharts() {
    // Gráfico de distribución por niveles
    const ctxNivel = document.getElementById('nivelEstudiantesChart');
    nivelEstudiantesChart = new Chart(ctxNivel, {
        type: 'doughnut',
        data: {
            labels: ['Principiante', 'Intermedio', 'Avanzado'],
            datasets: [{
                label: "Estudiantes por Nivel",
                data: [0, 0, 0], // Datos iniciales vacíos
                backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc'],
                borderWidth: 0
            }]
        },
        options: {
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { font: { size: 14 } }
                },
                tooltip: {
                    bodyFont: { size: 14 },
                    titleFont: { size: 16 }
                }
            }
        }
    });

    // Gráfico de categorías de cursos
    const ctxCategoria = document.getElementById('categoriaCursosChart');
    categoriaCursosChart = new Chart(ctxCategoria, {
        type: 'bar',
        data: {
            labels: [''],
            datasets: [{
                label: 'Cursos por categoría',
                data: [0, 0, 0, 0, 0], // Datos iniciales vacíos
                backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74c3c'],
                borderWidth: 0
            }]
        },
        options: {
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { font: { size: 12 } }
                },
                x: {
                    ticks: { font: { size: 12 } }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
    
    //Gráfico de Estudiantes por Curso
    estudiantesPorCursoChart = new Chart(
        document.getElementById('estudiantesPorCursoChart'), 
        {
            type: 'bar',
            data: {
                labels: [''],
                datasets: [{
                    label: 'Estudiantes por Curso',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: [
                        '#4e73df',
                        '#1cc88a',
                        '#36b9cc',
                        '#f6c23e',
                        '#e74c3c'
                    ],
                    borderRadius: 5,
                    barThickness: 20
                }]
            },
            options: {
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: { size: 12 }
                        }
                    },
                    x: {
                        ticks: {
                            font: { size: 12 }
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        bodyFont: { size: 14 },
                        titleFont: { size: 16 }
                    }
                }
            }
        }
    );


    // Gráfico para reportes
    new Chart(
        document.getElementById('reporteEstudiantesCurso'), 
        {
            type: 'pie',
            data: {
                labels: ['Guitarra', 'Piano', 'Canto', 'Violín', 'Teoría'],
                datasets: [{
                    label: 'Estudiantes por Curso',
                    data: [15, 12, 8, 5, 3],
                    backgroundColor: [
                        '#4e73df',
                        '#1cc88a',
                        '#36b9cc',
                        '#f6c23e',
                        '#e74c3c'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        bodyFont: {
                            size: 14
                        },
                        titleFont: {
                            size: 16
                        }
                    }
                }
            }
        }
    );
    
    new Chart(
        document.getElementById('reporteNiveles'), 
        {
            type: 'polarArea',
            data: {
                labels: ['Principiante', 'Intermedio', 'Avanzado'],
                datasets: [{
                    label: 'Distribución de Niveles',
                    data: [25, 15, 10],
                    backgroundColor: [
                        'rgba(78, 115, 223, 0.7)',
                        'rgba(28, 200, 138, 0.7)',
                        'rgba(54, 185, 204, 0.7)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 14
                            }
                        }
                    },  
                    tooltip: {
                        bodyFont: {
                            size: 14
                        },
                        titleFont: {
                            size: 16
                        }
                    }
                }
            }
        }
    );
    updateCharts();
}

function updateAll() {
    updateStateFromTable('estudiantes');
    updateStateFromTable('docentes');
    updateStateFromTable('cursos');
    updateCounters();
    updateCharts();
}

document.querySelectorAll('.theme-selector').forEach(selector => {
    selector.addEventListener('click', function() {
        const theme = this.dataset.theme;
        applyTheme(theme);
        
        document.querySelectorAll('.theme-selector').forEach(el => {
            el.classList.remove('active');
        });
        this.classList.add('active');
    });
});

// Sistema de temas
const themeToggle = document.getElementById('theme-toggle');
const themeToggleIcon = document.getElementById('theme-icon');

// Función para aplicar el tema
function applyTheme(theme) {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.querySelectorAll('.theme-selector').forEach(el => {
        el.classList.remove('theme-light', 'theme-dark', 'theme-auto');
    });
    
    if(theme !== 'default') {
        document.body.classList.add(`theme-${theme}`);
    }
    
    localStorage.setItem('theme', theme);
    
    const themeIcon = document.getElementById('theme-icon');
    themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Cargar tema guardado o detectar preferencia del sistema
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'default';
    applyTheme(savedTheme);
}

// Alternar entre temas
function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'default';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme)
}

const imgElement = document.getElementById('previewImagen');
let originalSrc = imgElement.src;
// Detectar selección de imagen y previsualizar
document.getElementById('imagen').addEventListener('change', function(event) {
    const file = event.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imgElement.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        // Si se canceló la selección, restaurar imagen previa
        imgElement.src = originalSrc;
    }
});

// Guardar cambios: subir imagen al servidor
$('#formImagen').on('submit', function(e) {
    e.preventDefault();

    const fileInput = $('#imagen')[0].files[0];

    // Si no seleccionó imagen y la actual es la por defecto, no hay nada que guardar
    if (!fileInput && originalSrc.includes('user.jpg')) {
        return;
    }

    // Si no hay archivo nuevo pero hay una imagen personalizada actual, no hacer nada
    if (!fileInput) {
        alert('No se ha seleccionado una nueva imagen para subir.');
        return;
    }

    const formData = new FormData(this);

    $.ajax({
        url: 'subir_imagen.php',
        type: 'POST',
        data: formData,
        contentType: false,
        processData: false,
        dataType: 'json',
        success: function(response) {
            if (response.status === 'success') {
                const newSrc = '../assets/img/perfiles/' + response.filename + '?t=' + Date.now();
                $('#previewImagen').attr('src', newSrc);
                originalSrc = newSrc;
                $('#imagen').val('');
                console.log('Imagen actualizada correctamente');
            } else {
                alert(response.message);
            }
        },
        error: function(xhr, status, error) {
            alert('Error al subir la imagen: ' + error);
        }
    });
});

function eliminarImagen() {
    const fileInput = document.getElementById('imagen');
    const imgElement = document.getElementById('previewImagen');

    // Extraer nombre del archivo actualmente mostrado
    const currentFilename = imgElement.src.split('/').pop().split('?')[0];

    if (currentFilename === 'user.jpg') {
        return;
    }

    $.ajax({
        url: 'eliminar_imagen.php',
        type: 'POST',
        data: {
            imagenActual: currentFilename
        },
        dataType: 'json',
        success: function(response) {
            if (response.status === 'success' || response.status === 'warning') {
                const defaultImg = '../assets/img/' + response.defaultImage + '?t=' + Date.now();
                imgElement.src = defaultImg;
                originalSrc = defaultImg;
                fileInput.value = '';
                console.log(response.message);
            } else if (response.status === 'info') {
                alert(response.message);
            } else {
                alert('Error: ' + response.message);
            }
        },
        error: function(xhr, status, error) {
            alert('Error al eliminar la imagen: ' + error);
        }
    });
}





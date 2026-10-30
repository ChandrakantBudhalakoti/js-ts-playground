/**
 * The toolchain's C++ library has no exception support, so a `throw` would
 * not even link. This stand-in reports the exception like an uncaught one
 * (`catch` blocks never run) and ends the program. It is C, written against
 * the Itanium C++ ABI, because C++ headers would make it slow to compile.
 */
export const CXX_RUNTIME = String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char *__cxa_demangle(const char *name, char *buffer, size_t *length, int *status);

void *__cxa_allocate_exception(size_t size) {
    void *p = calloc(1, size);
    if (!p) abort();
    return p;
}

void __cxa_free_exception(void *p) { free(p); }

/* std::exception and the standard exceptions derived from it: their what() is the third vtable slot. */
static const char *const STANDARD[] = {
    "St9exception", "St13runtime_error", "St11logic_error", "St16invalid_argument",
    "St12out_of_range", "St12length_error", "St12domain_error", "St11range_error",
    "St14overflow_error", "St15underflow_error", "St9bad_alloc", "St20bad_array_new_length",
    "St8bad_cast", "St10bad_typeid", "St17bad_function_call", "St12bad_any_cast",
    "St18bad_variant_access", "St19bad_optional_access",
};

typedef const char *(*what_fn)(const void *);

void __cxa_throw(void *object, void *type, void *(*destructor)(void *)) {
    (void)destructor;
    /* Itanium ABI: a type_info is { vtable, mangled name }. */
    const char *mangled = ((const char *const *)type)[1];
    int status = 0;
    char *name = __cxa_demangle(mangled, 0, 0, &status);
    fflush(stdout);
    fprintf(stderr, "terminate called after throwing an instance of '%s'", status == 0 && name ? name : mangled);
    for (size_t i = 0; i < sizeof STANDARD / sizeof *STANDARD; i++) {
        if (strcmp(mangled, STANDARD[i]) == 0) {
            what_fn *vtable = *(what_fn **)object;
            fprintf(stderr, ": %s", vtable[2](object));
            break;
        }
    }
    if (strcmp(mangled, "PKc") == 0 || strcmp(mangled, "Pc") == 0) fprintf(stderr, ": %s", *(const char **)object);
    if (strcmp(mangled, "i") == 0) fprintf(stderr, ": %d", *(int *)object);
    fprintf(stderr, "\n(C++ exceptions are not supported in this playground, so catch blocks do not run.)\n");
    exit(134);
}
`;

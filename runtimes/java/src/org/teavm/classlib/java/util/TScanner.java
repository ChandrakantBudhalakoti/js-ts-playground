package org.teavm.classlib.java.util;

import java.util.NoSuchElementException;

import java.io.InputStream;

/** Minimal Scanner for the probe: reads all of standard input from PlaygroundInput. */
public final class TScanner implements java.io.Closeable {
    private final String text;
    private int pos;

    public TScanner(InputStream in) {
        this(System.getProperty("codetakhti.stdin", ""));
    }

    public TScanner(String source) {
        text = source == null ? "" : source;
    }

    private void skipSpace() {
        while (pos < text.length() && Character.isWhitespace(text.charAt(pos))) pos++;
    }

    public boolean hasNext() {
        skipSpace();
        return pos < text.length();
    }

    public String next() {
        skipSpace();
        if (pos >= text.length()) throw new NoSuchElementException();
        int start = pos;
        while (pos < text.length() && !Character.isWhitespace(text.charAt(pos))) pos++;
        return text.substring(start, pos);
    }

    public int nextInt() {
        String token = next();
        try {
            return Integer.parseInt(token);
        } catch (NumberFormatException e) {
            throw new TInputMismatchException("For input string: \"" + token + "\"");
        }
    }

    public double nextDouble() {
        return Double.parseDouble(next());
    }

    public boolean hasNextInt() {
        int saved = pos;
        try {
            if (!hasNext()) return false;
            Integer.parseInt(next());
            return true;
        } catch (NumberFormatException e) {
            return false;
        } finally {
            pos = saved;
        }
    }

    public String nextLine() {
        if (pos >= text.length()) throw new NoSuchElementException("No line found");
        int end = text.indexOf('\n', pos);
        String line;
        if (end < 0) {
            line = text.substring(pos);
            pos = text.length();
        } else {
            line = text.substring(pos, end);
            pos = end + 1;
        }
        return line.endsWith("\r") ? line.substring(0, line.length() - 1) : line;
    }

    public void close() {}
}
